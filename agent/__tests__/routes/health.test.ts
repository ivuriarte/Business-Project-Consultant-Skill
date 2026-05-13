import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Hoist mock function so it's available inside vi.mock factory ──────────────

const { mockPing } = vi.hoisted(() => ({ mockPing: vi.fn() }));

vi.mock('@/lib/redis', () => ({
  redis: { ping: mockPing },
}));

import { GET } from '../../app/api/health/route';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with status ok when Redis ping succeeds', async () => {
    mockPing.mockResolvedValue('PONG');

    const res = await GET();
    const body = await res.json() as { status: string; redis: boolean; ts: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.redis).toBe(true);
    expect(typeof body.ts).toBe('string');
  });

  it('returns 503 with status degraded when Redis ping throws', async () => {
    mockPing.mockRejectedValue(new Error('Connection refused'));

    const res = await GET();
    const body = await res.json() as { status: string; redis: boolean; ts: string };

    expect(res.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.redis).toBe(false);
    expect(typeof body.ts).toBe('string');
  });

  it('returns 503 when Redis ping rejects with a non-Error value', async () => {
    mockPing.mockRejectedValue('timeout');

    const res = await GET();
    const body = await res.json() as { status: string; redis: boolean };

    expect(res.status).toBe(503);
    expect(body.redis).toBe(false);
  });
});
