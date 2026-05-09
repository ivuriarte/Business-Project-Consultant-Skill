import { redirect } from 'next/navigation';
import { Suspense } from 'react';
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
  const session = await getSession(sessionId).catch(() => null);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatInterface sessionId={sessionId} initialSession={session} />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-canvas">
      <div className="text-text-muted text-sm font-mono animate-pulse">Loading session…</div>
    </div>
  );
}
