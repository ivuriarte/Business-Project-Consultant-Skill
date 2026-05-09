import { vi, describe, it, expect } from 'vitest';

// Mock Upstash modules before any imports that trigger module-level instantiation
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  }),
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ success: true }) }),
    { slidingWindow: vi.fn().mockReturnValue({}) },
  ),
}));

import { isValidSessionId } from '../lib/redis';
import { getIp } from '../lib/ratelimit';
import { CURRENT_PROMPT_VERSION } from '../lib/types';

// ─── isValidSessionId ─────────────────────────────────────────────────────────

describe('isValidSessionId', () => {
  it('accepts a valid alphanumeric ID', () => {
    expect(isValidSessionId('abc123DEFGH')).toBe(true);
  });

  it('accepts IDs with hyphens and underscores', () => {
    expect(isValidSessionId('abc-def_12345')).toBe(true);
  });

  it('accepts an ID at the minimum length boundary (8 chars)', () => {
    expect(isValidSessionId('abcd1234')).toBe(true);
  });

  it('accepts an ID at the maximum length boundary (32 chars)', () => {
    expect(isValidSessionId('a'.repeat(32))).toBe(true);
  });

  it('rejects IDs shorter than 8 characters', () => {
    expect(isValidSessionId('abc123')).toBe(false);
  });

  it('rejects IDs longer than 32 characters', () => {
    expect(isValidSessionId('a'.repeat(33))).toBe(false);
  });

  it('rejects IDs with special characters', () => {
    expect(isValidSessionId('abc!@#$%^&*')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidSessionId('')).toBe(false);
  });
});

// ─── getIp ────────────────────────────────────────────────────────────────────

describe('getIp', () => {
  it('returns the first IP from x-forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '9.10.11.12' },
    });
    expect(getIp(req)).toBe('9.10.11.12');
  });

  it('returns "unknown" when no IP header is present', () => {
    const req = new Request('https://example.com');
    expect(getIp(req)).toBe('unknown');
  });
});

// ─── CURRENT_PROMPT_VERSION ───────────────────────────────────────────────────

describe('CURRENT_PROMPT_VERSION', () => {
  it('is a non-empty string', () => {
    expect(typeof CURRENT_PROMPT_VERSION).toBe('string');
    expect(CURRENT_PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});
