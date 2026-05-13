import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Chat: 20 requests per minute per IP (streaming turns)
export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'rl:chat',
  analytics: false,
});

// Export: 5 requests per hour per IP
export const exportRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:export',
  analytics: false,
});

// New session creation: 5 new sessions per hour per IP (prevents session explosion / cost abuse)
export const newSessionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'rl:new-session',
  analytics: false,
});

// Helper to extract client IP from request headers
export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
