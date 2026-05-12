import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock all external dependencies before importing the route ─────────────────

vi.mock('@/lib/redis', () => ({
  isValidSessionId: (id: string) => /^[A-Za-z0-9_-]{8,32}$/.test(id),
  getSession: vi.fn(),
  updateSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ratelimit', () => ({
  exportRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getIp: vi.fn().mockReturnValue('1.2.3.4'),
}));

vi.mock('@/lib/github', () => ({
  exportToGitHubIssues: vi.fn(),
}));

import { POST } from '../../app/api/export/github/route';
import { getSession } from '@/lib/redis';
import { exportToGitHubIssues } from '@/lib/github';
import { exportRatelimit } from '@/lib/ratelimit';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_SESSION_ID = 'valid-session-1';

const mockEpic = {
  id: 'EPIC-01',
  name: 'Test Epic',
  summary: 'A test epic',
  business_value: 'Critical path',
  target_users: 'Developers',
  priority: 'Must Have' as const,
  phase: 'MVP' as const,
  stories: [],
};

const mockSession = {
  id: VALID_SESSION_ID,
  created_at: '2026-05-13T00:00:00.000Z',
  updated_at: '2026-05-13T00:00:00.000Z',
  stage: 'backlog_generated' as const,
  prompt_version: 'v1',
  epics: [mockEpic],
  messages: [],
  tokens_used: 0,
};

const mockExportResult = {
  issues_created: 1,
  issue_urls: ['https://github.com/owner/repo/issues/1'],
};

function makeRequest(body: object): Request {
  return new Request('https://example.com/api/export/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/export/github', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(exportToGitHubIssues).mockResolvedValue(mockExportResult);
    vi.mocked(exportRatelimit.limit).mockResolvedValue({ success: true } as never);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when sessionId fails format validation', async () => {
    const res = await POST(makeRequest({ sessionId: 'bad!', owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when owner contains invalid characters', async () => {
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'bad owner', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when repo contains invalid characters', async () => {
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'bad repo!', token: 'ghp_xxx' }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when session is not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(404);
  });

  it('returns 422 when session has no epics', async () => {
    vi.mocked(getSession).mockResolvedValue({ ...mockSession, epics: [] });
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(422);
  });

  it('returns 429 when export rate limit is reached', async () => {
    vi.mocked(exportRatelimit.limit).mockResolvedValue({ success: false } as never);
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(429);
  });

  it('returns 502 when GitHub API throws an error', async () => {
    vi.mocked(exportToGitHubIssues).mockRejectedValue(new Error('GitHub API error 422: Validation Failed'));
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 200 with issue URLs on success', async () => {
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.issues_created).toBe(1);
    expect(body.issue_urls).toHaveLength(1);
  });

  it('fails open (proceeds) when rate limit check throws', async () => {
    vi.mocked(exportRatelimit.limit).mockRejectedValue(new Error('Redis unavailable'));
    const res = await POST(makeRequest({ sessionId: VALID_SESSION_ID, owner: 'user', repo: 'repo', token: 'ghp_xxx' }));
    // Should reach GitHub API, not crash on rate limit error
    expect(res.status).toBe(200);
  });
});
