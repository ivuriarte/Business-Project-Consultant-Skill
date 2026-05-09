import { getSession, updateSession, isValidSessionId } from '@/lib/redis';
import { exportToGitHubIssues } from '@/lib/github';
import { exportRatelimit, getIp } from '@/lib/ratelimit';
import type { ExportRequestBody } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: Request) {
  // ── Rate limiting ───────────────────────────────────────────────────────
  const ip = getIp(req);
  try {
    const { success: rateLimitOk } = await exportRatelimit.limit(ip);
    if (!rateLimitOk) {
      return Response.json(
        { error: 'Export rate limit reached. You can export up to 5 times per hour.' },
        { status: 429 }
      );
    }
  } catch {
    // Redis unavailable — fail open
    console.warn(JSON.stringify({ event: 'ratelimit_unavailable', route: 'export', ts: new Date().toISOString() }));
  }

  let body: ExportRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { sessionId, owner, repo, token } = body;

  if (!sessionId || !owner || !repo || !token) {
    return Response.json(
      { error: 'Missing required fields: sessionId, owner, repo, token' },
      { status: 400 }
    );
  }

  // ── Input validation ────────────────────────────────────────────────────
  if (!isValidSessionId(sessionId)) {
    return Response.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) {
    return Response.json({ error: 'Invalid owner or repo name' }, { status: 400 });
  }

  const session = await getSession(sessionId);

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!session.epics || session.epics.length === 0) {
    return Response.json(
      { error: 'No backlog found in this session. Generate a backlog first.' },
      { status: 422 }
    );
  }

  console.log(JSON.stringify({ event: 'export_request', sessionId, repo: `${owner}/${repo}`, epic_count: session.epics.length, ts: new Date().toISOString() }));

  try {
    const result = await exportToGitHubIssues(owner, repo, session.epics, token);

    await updateSession(sessionId, {
      stage: 'export',
      github_export: {
        exported_at: new Date().toISOString(),
        repo: `${owner}/${repo}`,
        issue_urls: result.issue_urls,
      },
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
