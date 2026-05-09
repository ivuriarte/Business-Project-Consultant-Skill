import { streamText, type CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getOrCreateSession, updateSession, appendMessages } from '@/lib/redis';
import { buildSystemPrompt } from '@/lib/instructions';
import type { Epic, ProjectMeta } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60;

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
});

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
  const body = await req.json();
  const { messages, sessionId } = body as {
    messages: CoreMessage[];
    sessionId: string;
  };

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const session = await getOrCreateSession(sessionId);
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
    onFinish: async ({ text }) => {
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
      } catch {
        // Non-critical — don't fail the response if persistence fails
      }
    },
  });

  return result.toDataStreamResponse();
}
