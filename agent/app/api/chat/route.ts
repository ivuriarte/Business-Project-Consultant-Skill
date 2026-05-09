import { streamText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getOrCreateSession, updateSession, appendMessages, addTokenUsage, isValidSessionId } from '@/lib/redis';
import { buildSystemPrompt } from '@/lib/instructions';
import { chatRatelimit, getIp } from '@/lib/ratelimit';
import type { Epic, ProjectMeta } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

/** Per-session token budget (~$2 at GPT-4o pricing) */
const SESSION_TOKEN_LIMIT = 100_000;

// ─── Zod schemas for tool parameters ─────────────────────────────────────────

const AcceptanceCriteriaSchema = z.object({
  given: z.string(),
  when: z.string(),
  then: z.string(),
});

const UserStorySchema = z.object({
  id: z.string().describe('Story ID e.g. EPIC-01-S01'),
  title: z.string(),
  actor: z.string(),
  action: z.string(),
  outcome: z.string(),
  acceptance_criteria: z.array(AcceptanceCriteriaSchema).min(2),
  priority: z.enum(['Must Have', 'Should Have', 'Could Have', "Won't Have"]),
  effort: z.enum(['XS', 'S', 'M', 'L', 'XL']),
  phase: z.enum(['MVP', 'Stabilization', 'Enhancement', 'Growth']),
  business_value: z.number().int().min(1).max(5),
  user_impact: z.number().int().min(1).max(5),
  feasibility: z.number().int().min(1).max(5),
  value_score: z.number(),
}).transform(story => ({
  ...story,
  // Recompute from source fields — ignores whatever value the model provides
  // Formula: (BV×0.4) + (UI×0.35) + (F×0.25)
  value_score: parseFloat(
    (story.business_value * 0.4 + story.user_impact * 0.35 + story.feasibility * 0.25).toFixed(2),
  ),
}));

const EpicSchema = z.object({
  id: z.string().describe('Epic ID e.g. EPIC-01'),
  name: z.string(),
  summary: z.string(),
  business_value: z.string(),
  target_users: z.string(),
  priority: z.enum(['Must Have', 'Should Have', 'Could Have']),
  phase: z.enum(['MVP', 'Stabilization', 'Enhancement', 'Growth']),
  stories: z.array(UserStorySchema).min(1),
});

const ProjectMetaSchema = z.object({
  name: z.string(),
  problem_statement: z.string(),
  target_user: z.string(),
  success_metrics: z.string(),
  out_of_scope: z.string(),
  tech_stack: z.string().optional(),
  repository: z.string().optional().describe('GitHub repo in owner/repo format'),
});

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── Rate limiting ─────────────────────────────────────────────────────────
  const ip = getIp(req);
  try {
    const { success: rateLimitOk } = await chatRatelimit.limit(ip);
    if (!rateLimitOk) {
      return new Response('Too many requests. Please wait a moment.', { status: 429 });
    }
  } catch {
    // Redis unavailable — fail open rather than blocking all traffic
    console.warn(JSON.stringify({ event: 'ratelimit_unavailable', route: 'chat', ts: new Date().toISOString() }));
  }

  const body = await req.json();
  const { messages, sessionId } = body as {
    messages: CoreMessage[];
    sessionId: string;
  };

  // ── Input validation ──────────────────────────────────────────────────────
  if (!sessionId || !isValidSessionId(sessionId)) {
    return new Response('Invalid or missing sessionId', { status: 400 });
  }

  const session = await getOrCreateSession(sessionId);

  // ── Per-session token cap ─────────────────────────────────────────────────
  if ((session.tokens_used ?? 0) >= SESSION_TOKEN_LIMIT) {
    return new Response(
      JSON.stringify({
        error: 'session_token_limit',
        message: `This session has reached its token limit (${SESSION_TOKEN_LIMIT.toLocaleString()} tokens). Please start a new session to continue.`,
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(JSON.stringify({ event: 'chat_request', sessionId, stage: session.stage, tokens_used: session.tokens_used ?? 0, ts: new Date().toISOString() }));
  const systemPrompt = buildSystemPrompt(session);

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    maxTokens: 8000,
    maxSteps: 5,
    tools: {
      // ── Tool 1: Persist the generated backlog to Redis ─────────────────────
      persist_backlog: {
        description:
          'Save the fully generated backlog to the session. Call this ONLY after ALL epics and stories are written in the response with complete acceptance criteria.',
        parameters: z.object({
          project: ProjectMetaSchema,
          epics: z.array(EpicSchema).min(1),
        }),
        execute: async ({
          project,
          epics,
        }: {
          project: z.infer<typeof ProjectMetaSchema>;
          epics: z.infer<typeof EpicSchema>[];
        }) => {
          const totalStories = epics.reduce((n, e) => n + e.stories.length, 0);

          await updateSession(sessionId, {
            stage: 'backlog_generated',
            project: project as ProjectMeta,
            epics: epics as Epic[],
          });

          return {
            success: true,
            epics_count: epics.length,
            stories_count: totalStories,
            session_url: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/?s=${sessionId}`,
            message: `Backlog saved — ${epics.length} epics, ${totalStories} stories. Use the Export button in the sidebar to push to GitHub Issues.`,
          };
        },
      },
    },
    onFinish: async ({ text, usage }) => {
      // Track token usage for cost control
      try {
        if (usage?.totalTokens) {
          await addTokenUsage(sessionId, usage.totalTokens);
        }
      } catch {
        // Non-critical
      }

      // Persist the conversation turn to Redis for session resumability
      try {
        const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
        const newMessages = [];

        if (lastUserMsg && typeof lastUserMsg.content === 'string') {
          newMessages.push({ role: 'user' as const, content: lastUserMsg.content });
        }
        if (text) {
          newMessages.push({ role: 'assistant' as const, content: text });
        }

        if (newMessages.length) {
          await appendMessages(sessionId, newMessages);
        }
      } catch (err) {
        console.error('[chat/onFinish] Failed to persist messages:', err);
      }
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error(JSON.stringify({
        event: 'stream_error',
        sessionId,
        error: error instanceof Error ? error.message : String(error),
        ts: new Date().toISOString(),
      }));
      return 'Stream interrupted — please try again.';
    },
  });
}
