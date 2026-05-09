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
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const [backlog, setBacklog] = useState<BacklogState>({
    project: initialSession?.project,
    epics:   initialSession?.epics ?? [],
    stage:   initialSession?.stage ?? 'welcome',
  });
  const [copied, setCopied]         = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      fetch(`/api/session/${sessionId}`)
        .then(r => r.ok ? r.json() : null)
        .then((session: AgentSession | null) => {
          if (session) {
            setBacklog({ project: session.project, epics: session.epics, stage: session.stage });
          }
        })
        .catch(() => null);
    },
  });

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [sessionId]);

  const hasBacklog = backlog.epics.length > 0;

  return (
    <div className="flex h-screen bg-canvas text-text-primary overflow-hidden">

      {/* ── Mobile sidebar overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-canvas/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:translate-x-0
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <BacklogPanel
          backlog={backlog}
          sessionId={sessionId}
          onCopyLink={copySessionLink}
          copied={copied}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border bg-surface shrink-0">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <MenuIcon />
          </button>

          {/* Logo — visible on mobile where sidebar is hidden */}
          <span className="md:hidden font-mono text-sm font-semibold text-text-primary">
            Idea <span className="text-accent">→</span> Agent
          </span>

          <div className="flex-1" />

          {/* Session pill */}
          <button
            onClick={copySessionLink}
            title="Copy shareable session link"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-border text-text-muted hover:text-text-primary text-[11px] font-mono transition-colors border border-border"
          >
            <span className="truncate max-w-[80px]">{sessionId}</span>
            <span className="text-accent text-[10px]">{copied ? '✓' : '⎘'}</span>
          </button>

          {/* Export */}
          {hasBacklog && (
            <ExportButton sessionId={sessionId} projectName={backlog.project?.name} />
          )}
        </header>

        {/* ── Messages (aria-live for screen readers) ─────────────── */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="flex-1 overflow-y-auto py-6"
        >
          {messages.length === 0 && !isLoading && <WelcomeScreen />}

          <div className="max-w-3xl mx-auto space-y-0.5">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isLoading && <TypingIndicator />}

            {error && (
              <div className="mx-4 my-2 px-4 py-3 rounded-lg bg-danger/8 border border-danger/20 text-danger text-sm">
                {error.message.includes('session_token_limit')
                  ? 'This session has reached its token limit. Please start a new session.'
                  : `Error: ${error.message}`
                }
              </div>
            )}
          </div>

          <div ref={bottomRef} />
        </div>

        {/* ── Input ───────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 pb-4 pt-3 border-t border-border bg-surface">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 max-w-3xl mx-auto"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe your idea or answer the question above…"
              rows={1}
              disabled={isLoading}
              aria-label="Message input"
              className="
                flex-1 resize-none rounded-xl border border-border bg-surface-2
                px-4 py-3 text-sm text-text-primary placeholder-text-muted
                focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10
                transition-all disabled:opacity-50 min-h-[44px] max-h-44
              "
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="
                shrink-0 h-11 px-5 rounded-xl bg-accent hover:bg-accent-dim
                disabled:opacity-30 disabled:cursor-not-allowed
                text-accent-fg text-sm font-semibold font-mono
                transition-all active:scale-95
              "
            >
              {isLoading ? '…' : '→'}
            </button>
          </form>
          <p className="text-center text-text-muted text-[10px] font-mono mt-2 tracking-wide">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

const STARTERS = [
  'I want to build an app that helps freelancers track invoices automatically…',
  'I have an idea for a platform where local farmers can sell directly to consumers…',
  'I want to automate the employee onboarding process at my company…',
];

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6 animate-fade-in select-none">
      {/* Brand mark */}
      <div className="mb-8">
        <div className="font-mono text-5xl font-bold text-accent tracking-tight">→</div>
        <div className="font-mono text-sm font-semibold text-text-primary mt-2 tracking-tight">
          Idea → Agent
        </div>
        <div className="text-text-muted text-xs font-mono mt-1 tracking-wide">
          Raw idea. Developer-ready backlog.
        </div>
      </div>

      {/* Description */}
      <p className="text-text-secondary text-sm max-w-xs leading-relaxed mb-8">
        Describe your idea — rough is fine. I'll guide you through a structured BA/PM/PO process
        to produce prioritized Epics, User Stories, and Acceptance Criteria.
      </p>

      {/* Starter prompts */}
      <div className="w-full max-w-sm space-y-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-3">Try saying…</p>
        {STARTERS.map(s => (
          <div
            key={s}
            className="px-4 py-2.5 rounded-lg border border-border bg-surface text-left text-xs text-text-muted leading-relaxed italic hover:border-accent/30 hover:text-text-secondary transition-colors cursor-default"
          >
            "{s}"
          </div>
        ))}
      </div>

      {/* Legal links */}
      <div className="mt-10 flex gap-4 text-[10px] text-text-muted font-mono">
        <a href="/privacy" className="hover:text-accent transition-colors">Privacy</a>
        <span>·</span>
        <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-2 max-w-3xl animate-fade-in">
      <div className="w-0.5 h-6 bg-accent/30 rounded-full shrink-0 mt-1" />
      <div className="flex items-center gap-1.5 py-2">
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-accent/50 animate-bounce-dot"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}
