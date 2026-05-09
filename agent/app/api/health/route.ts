import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function GET() {
  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
  } catch {
    // Redis unavailable
  }

  const status = redisOk ? 'ok' : 'degraded';
  return Response.json(
    { status, redis: redisOk, ts: new Date().toISOString() },
    { status: redisOk ? 200 : 503 },
  );
}
