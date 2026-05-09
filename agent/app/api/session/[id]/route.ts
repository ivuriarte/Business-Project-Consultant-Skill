import { getSession, deleteSession, isValidSessionId } from '@/lib/redis';

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
