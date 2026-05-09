import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { getSession } from '@/lib/redis';
import { ChatInterface } from '@/components/ChatInterface';

interface PageProps {
  searchParams: Promise<{ s?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  // If no session ID, generate one and redirect (creates a shareable URL immediately)
  if (!params.s) {
    redirect(`/?s=${nanoid(10)}`);
  }

  const sessionId = params.s;

  // Race against a 3 s timeout so a slow/unavailable Redis never blocks the page
  const session = await Promise.race([
    getSession(sessionId).catch(() => null),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
  ]);

  // ChatInterface is a client component — no Suspense needed; render it directly
  // so the server always includes its HTML rather than deferring to client JS load.
  return <ChatInterface sessionId={sessionId} initialSession={session} />;
}

