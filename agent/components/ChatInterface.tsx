'use client';

import { useChat, type Message } from 'ai/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { AgentSession, Epic, ProjectMeta } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { BacklogPanel } from './BacklogPanel';
import { ExportButton } from './ExportButton';

interface ChatInterfaceProps {
  sessionId: string;
  initialSession: AgentSession | null;
}

interface BacklogState {
  project?: ProjectMeta;
  epics: Epic[];
  stage: AgentSession['stage'];
}

export function ChatInterface({ sessionId, initialSession }: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [backlog, setBacklog] = useState<BacklogState>({
    project: initialSession?.project,
    epics: initialSession?.epics ?? [],
    stage: initialSession?.stage ?? 'welcome',
  });

  const [copied, setCopied] = useState(false);

  const initialMessages: Message[] = (initialSession?.messages ?? []).map((m, i) => ({
    id: `init-${i}`,
    role: m.role,
    content: m.content,
  }));

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    body: { sessionId },
    initialMessages,
    onFinish: () => {
      // After each turn, re-fetch session to pick up any backlog changes
      fetch(`/api/session/${sessionId}`)
        .then(r => r.ok ? r.json() : null)
        .then((session: AgentSession | null) => {
          if (session) {
            setBacklog({
              project: session.project,
              epics: session.epics,
              stage: session.stage,
            });
          }
        })
        .catch(() => null);
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle textarea auto-resize + Enter to submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && input.trim()) {
          handleSubmit(e as unknown as React.FormEvent);
        }
      }
    },
    [handleSubmit, isLoading, input]
  );

  const copySessionLink = useCallback(() => {
    const url = `${window.location.origin}/?s=${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sessionId]);

  const hasBacklog = backlog.epics.length > 0;

  return (
    <div className="flex h-screen bg-canvas text-text-primary overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <BacklogPanel
        backlog={backlog}
        sessionId={sessionId}
        onCopyLink={copySessionLink}
        copied={copied}
      />

      {/* ── Main chat area ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-text-secondary text-sm font-mono">
              Session
            </span>
            <button
              onClick={copySessionLink}
              title="Copy shareable link"
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-border-muted hover:bg-border text-text-secondary hover:text-text-primary text-xs font-mono transition-colors"
            >
              <span>{sessionId}</span>
              <span>{copied ? '✓' : '⎘'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasBacklog && (
              <ExportButton sessionId={sessionId} projectName={backlog.project?.name} />
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {messages.length === 0 && !isLoading && (
            <WelcomeScreen />
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && <TypingIndicator />}

          {error && (
            <div className="mx-auto max-w-2xl px-4 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              Error: {error.message}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border bg-surface">
          <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea, answer questions, or ask to refine the backlog…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50 min-h-[44px] max-h-40"
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-11 px-5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-canvas text-sm font-semibold transition-colors"
            >
              {isLoading ? '…' : 'Send'}
            </button>
          </form>
          <p className="text-center text-text-muted text-xs mt-2">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6 animate-fade-in">
      <div className="text-4xl mb-4">💡</div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        What's your idea?
      </h2>
      <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
        Describe it in plain language — rough is fine. I'll guide you through a structured process
        to turn it into a developer-ready backlog.
      </p>
      <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
        {STARTERS.map(s => (
          <p key={s} className="text-xs text-text-muted italic">"{s}"</p>
        ))}
      </div>
    </div>
  );
}

const STARTERS = [
  'I want to build an app that helps freelancers track their invoices…',
  'I have an idea for a platform where local farmers can sell directly to consumers…',
  'I want to automate the onboarding process at my company…',
];

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-2 py-1 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs">A</span>
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-surface border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
