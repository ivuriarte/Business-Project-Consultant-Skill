import { Redis } from '@upstash/redis';
import type { AgentSession, StoredMessage } from './types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export { redis };

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Validate session ID format — must match nanoid(10) alphabet, 8–32 chars */
export function isValidSessionId(id: string): boolean {
  return /^[A-Za-z0-9_-]{8,32}$/.test(id);
}

export async function getSession(id: string): Promise<AgentSession | null> {
  return redis.get<AgentSession>(`${SESSION_PREFIX}${id}`);
}

export async function getOrCreateSession(id: string): Promise<AgentSession> {
  const existing = await getSession(id);
  if (existing) return existing;

  const session: AgentSession = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stage: 'welcome',
    epics: [],
    messages: [],
    tokens_used: 0,
  };

  await redis.set(`${SESSION_PREFIX}${id}`, session, { ex: SESSION_TTL_SECONDS });
  return session;
}

export async function updateSession(
  id: string,
  updates: Partial<Omit<AgentSession, 'id' | 'created_at'>>
): Promise<AgentSession> {
  const existing = await getSession(id);
  if (!existing) throw new Error(`Session not found: ${id}`);

  const updated: AgentSession = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  await redis.set(`${SESSION_PREFIX}${id}`, updated, { ex: SESSION_TTL_SECONDS });
  return updated;
}

export async function appendMessages(
  id: string,
  newMessages: StoredMessage[]
): Promise<void> {
  const session = await getSession(id);
  if (!session) return;

  // Keep last 100 messages to prevent unbounded growth
  const combined = [...session.messages, ...newMessages].slice(-100);
  await updateSession(id, { messages: combined });
}

export async function addTokenUsage(id: string, tokens: number): Promise<void> {
  const session = await getSession(id);
  if (!session) return;
  await updateSession(id, { tokens_used: (session.tokens_used ?? 0) + tokens });
}

export async function deleteSession(id: string): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${id}`);
}
