import { getSession, updateSession } from '@/lib/redis';
import { exportToGitHubIssues } from '@/lib/github';
import type { ExportRequestBody } from '@/lib/types';

export async function POST(req: Request) {
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

  // Validate repo format
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(`${owner}/${repo}`)) {
    return Response.json({ error: 'Invalid repo format. Use: owner/repo' }, { status: 400 });
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
