import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock all external dependencies before importing the route ─────────────────

vi.mock('@/lib/redis', () => ({
  isValidSessionId: (id: string) => /^[A-Za-z0-9_-]{8,32}$/.test(id),
  getSession: vi.fn(),
  getOrCreateSession: vi.fn(),
  updateSession: vi.fn().mockResolvedValue(undefined),
  appendMessages: vi.fn().mockResolvedValue(undefined),
  appendEpics: vi.fn().mockResolvedValue(undefined),
  addTokenUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ratelimit', () => ({
  chatRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  newSessionRatelimit: { limit: vi.fn().mockResolvedValue({ success: true }) },
  getIp: vi.fn().mockReturnValue('1.2.3.4'),
}));

vi.mock('@/lib/instructions', () => ({
  buildSystemPrompt: vi.fn().mockReturnValue('mock system prompt'),
}));

vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toDataStreamResponse: vi.fn().mockReturnValue(new Response('stream-data', { status: 200 })),
  }),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn().mockReturnValue('mock-model'),
}));

import { POST } from '../../app/api/chat/route';
import { getSession, getOrCreateSession } from '@/lib/redis';
import { chatRatelimit, newSessionRatelimit } from '@/lib/ratelimit';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_SESSION_ID = 'valid-session-1';

const mockSession = {
  id: VALID_SESSION_ID,
  created_at: '2026-05-13T00:00:00.000Z',
  updated_at: '2026-05-13T00:00:00.000Z',
  stage: 'intake' as const,
  prompt_version: 'v1',
  epics: [],
  messages: [],
  tokens_used: 0,
};

function makeRequest(body: object): Request {
  return new Request('https://example.com/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(getOrCreateSession).mockResolvedValue(mockSession);
    vi.mocked(chatRatelimit.limit).mockResolvedValue({ success: true } as never);
    vi.mocked(newSessionRatelimit.limit).mockResolvedValue({ success: true } as never);
  });

  it('returns 400 when sessionId is missing', async () => {
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when sessionId fails format validation', async () => {
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: 'bad!' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when sessionId is too short', async () => {
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: 'abc' }));
    expect(res.status).toBe(400);
  });

  it('returns 429 when rate limited', async () => {
    vi.mocked(chatRatelimit.limit).mockResolvedValue({ success: false } as never);
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(429);
  });

  it('returns 402 when session token limit is reached', async () => {
    const overLimit = { ...mockSession, tokens_used: 100_001 };
    vi.mocked(getSession).mockResolvedValue(overLimit);
    vi.mocked(getOrCreateSession).mockResolvedValue(overLimit);
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe('session_token_limit');
  });

  it('returns 402 exactly at the token limit boundary', async () => {
    const atLimit = { ...mockSession, tokens_used: 100_000 };
    vi.mocked(getSession).mockResolvedValue(atLimit);
    vi.mocked(getOrCreateSession).mockResolvedValue(atLimit);
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(402);
  });

  it('returns 200 and initiates stream for a valid request', async () => {
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(200);
  });

  it('fails open (proceeds) when rate limit check throws', async () => {
    vi.mocked(chatRatelimit.limit).mockRejectedValue(new Error('Redis unavailable'));
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    // Should still reach streamText, not crash
    expect(res.status).toBe(200);
  });

  it('returns 429 when new-session creation rate limit is reached', async () => {
    // Simulate a brand-new session (preCheck returns null)
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(newSessionRatelimit.limit).mockResolvedValue({ success: false } as never);
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(429);
  });

  it('skips new-session rate limit for existing sessions', async () => {
    // preCheck returns an existing session — newSessionRatelimit should not be called
    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(newSessionRatelimit.limit).mockResolvedValue({ success: false } as never); // would block if called
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'hi' }], sessionId: VALID_SESSION_ID }));
    expect(res.status).toBe(200); // existing session bypasses new-session limit
  });
});
