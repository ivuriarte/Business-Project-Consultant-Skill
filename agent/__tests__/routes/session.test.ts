import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mock all external dependencies before importing the route ─────────────────

vi.mock('@/lib/redis', () => ({
  isValidSessionId: (id: string) => /^[A-Za-z0-9_-]{8,32}$/.test(id),
  getSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

import { GET, DELETE, PATCH } from '../../app/api/session/[id]/route';
import { getSession, updateSession } from '@/lib/redis';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_ID = 'valid-session-1';
const ADMIN_SECRET = 'test-admin-secret-xyz';

const mockSession = {
  id: VALID_ID,
  created_at: '2026-05-13T00:00:00.000Z',
  updated_at: '2026-05-13T00:00:00.000Z',
  stage: 'intake' as const,
  prompt_version: 'v1',
  epics: [],
  messages: [],
  tokens_used: 0,
};

type RouteContext = { params: Promise<{ id: string }> };

function ctx(id: string): RouteContext {
  return { params: Promise.resolve({ id }) };
}

function makeRequest(method = 'GET', body?: object, headers?: Record<string, string>): Request {
  return new Request('https://example.com/api/session/test', {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/session/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue(mockSession);
  });

  it('returns 400 for an invalid session ID', async () => {
    const res = await GET(makeRequest(), ctx('bad!'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a session ID that is too short', async () => {
    const res = await GET(makeRequest(), ctx('abc'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when session is not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(makeRequest(), ctx(VALID_ID));
    expect(res.status).toBe(404);
  });

  it('returns 200 with the session data', async () => {
    const res = await GET(makeRequest(), ctx(VALID_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(VALID_ID);
    expect(body.stage).toBe('intake');
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/session/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for an invalid session ID', async () => {
    const res = await DELETE(makeRequest('DELETE'), ctx('bad!'));
    expect(res.status).toBe(400);
  });

  it('returns 200 on successful deletion', async () => {
    const res = await DELETE(makeRequest('DELETE'), ctx(VALID_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/session/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(updateSession).mockResolvedValue({ ...mockSession, stage: 'welcome' });
    process.env.ADMIN_SECRET = ADMIN_SECRET;
  });

  afterEach(() => {
    delete process.env.ADMIN_SECRET;
  });

  it('returns 401 when ADMIN_SECRET env var is not set', async () => {
    delete process.env.ADMIN_SECRET;
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-Admin-Secret header is absent', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }), ctx(VALID_ID));
    expect(res.status).toBe(401);
  });

  it('returns 401 when X-Admin-Secret header value is wrong', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }, { 'X-Admin-Secret': 'wrong-secret' }), ctx(VALID_ID));
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid session ID', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx('bad!'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for an unknown stage value', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'not_a_real_stage' }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
    expect(res.status).toBe(400);
  });

  it('returns 404 when session is not found', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
    expect(res.status).toBe(404);
  });

  it('returns 200 and calls updateSession with the new stage', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'welcome' }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
    expect(res.status).toBe(200);
    expect(vi.mocked(updateSession)).toHaveBeenCalledWith(VALID_ID, { stage: 'welcome' });
  });

  it('clears epics when clearEpics is true', async () => {
    const res = await PATCH(makeRequest('PATCH', { stage: 'intake', clearEpics: true }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
    expect(res.status).toBe(200);
    expect(vi.mocked(updateSession)).toHaveBeenCalledWith(VALID_ID, { stage: 'intake', epics: [] });
  });

  it('accepts all valid stage values', async () => {
    const stages = ['welcome', 'business_intent', 'intake', 'backlog_generated', 'export'];
    for (const stage of stages) {
      vi.mocked(updateSession).mockResolvedValue({ ...mockSession, stage: stage as typeof mockSession.stage });
      const res = await PATCH(makeRequest('PATCH', { stage }, { 'X-Admin-Secret': ADMIN_SECRET }), ctx(VALID_ID));
      expect(res.status).toBe(200);
    }
  });
});
