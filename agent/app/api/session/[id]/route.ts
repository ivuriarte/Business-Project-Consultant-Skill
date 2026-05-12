import { getSession, deleteSession, isValidSessionId, updateSession } from '@/lib/redis';
import type { Stage } from '@/lib/types';

export const runtime = 'edge';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !isValidSessionId(id)) {
    return Response.json({ error: 'Invalid session id' }, { status: 400 });
  }

  const session = await getSession(id);

  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  return Response.json(session);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !isValidSessionId(id)) {
    return Response.json({ error: 'Invalid session id' }, { status: 400 });
  }

  await deleteSession(id);
  return Response.json({ success: true });
}

/** Admin-only endpoint to manually override session stage or clear epics.
 *  Requires X-Admin-Secret header matching the ADMIN_SECRET env var.
 *  Use to recover sessions stuck at 'intake' when persist_backlog was never called. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || req.headers.get('X-Admin-Secret') !== adminSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !isValidSessionId(id)) {
    return Response.json({ error: 'Invalid session id' }, { status: 400 });
  }

  let body: { stage?: string; clearEpics?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const VALID_STAGES: readonly Stage[] = ['welcome', 'business_intent', 'intake', 'backlog_generated', 'export'] as const;
  if (body.stage !== undefined && !VALID_STAGES.includes(body.stage as Stage)) {
    return Response.json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` }, { status: 400 });
  }

  const session = await getSession(id);
  if (!session) {
    return Response.json({ error: 'Session not found' }, { status: 404 });
  }

  const updates: Parameters<typeof updateSession>[1] = {};
  if (body.stage !== undefined) updates.stage = body.stage as Stage;
  if (body.clearEpics) updates.epics = [];

  const updated = await updateSession(id, updates);
  return Response.json(updated);
}
