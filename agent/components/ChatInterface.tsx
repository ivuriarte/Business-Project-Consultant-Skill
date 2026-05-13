'use client';

import { useChat, type Message } from 'ai/react';
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
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
  const [showTemplates, setShowTemplates] = useState(false);

  const initialMessages: Message[] = (initialSession?.messages ?? []).map((m, i) => ({
    id: `init-${i}`,
    role: m.role,
    content: m.content,
  }));

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append } = useChat({
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

  const handleStarterSelect = useCallback((text: string) => {
    void append({ role: 'user', content: text });
  }, [append]);

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
          onOpenTemplates={() => setShowTemplates(true)}
          onSelectExample={handleStarterSelect}
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

          {/* Frank — visible on mobile where sidebar is hidden */}
          <span className="md:hidden font-semibold text-sm text-agent-violet">Frank</span>

          {/* Stage header — desktop */}
          {STAGE_HEADER[backlog.stage] && (
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-text-primary leading-tight">
                {STAGE_HEADER[backlog.stage].label}
              </div>
              <div className="text-[10px] text-text-muted">{STAGE_HEADER[backlog.stage].desc}</div>
            </div>
          )}

          <div className="flex-1" />

          {/* Session pill + bookmark hint */}
          <div className="hidden sm:flex flex-col items-end gap-0.5">
            <button
              onClick={copySessionLink}
              title="Copy shareable session link"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-border text-text-muted hover:text-text-primary text-[11px] font-mono transition-colors border border-border"
            >
              <span className="truncate max-w-[80px]">{sessionId}</span>
              <span className="text-accent text-[10px]">{copied ? '✓' : '⎈'}</span>
            </button>
            <span className="text-[9px] font-mono text-text-muted/60">bookmark to return</span>
          </div>

          {/* Start fresh */}
          {backlog.stage !== 'welcome' && (
            <button
              onClick={() => { window.location.href = '/'; }}
              title="Start a new session"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-transparent hover:bg-surface-2 border border-border/60 text-text-muted hover:text-text-primary text-[11px] font-mono transition-colors"
            >
              + New
            </button>
          )}

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
          {messages.length === 0 && !isLoading && (
            <WelcomeScreen
              onSelect={handleStarterSelect}
              onOpenTemplates={() => setShowTemplates(true)}
            />
          )}

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
          {showTemplates && (
            <TemplatesPicker
              onSelect={(t) => { handleStarterSelect(t); setShowTemplates(false); }}
              onClose={() => setShowTemplates(false)}
            />
          )}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-surface-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Describe your idea, or reply to Frank…"
                rows={1}
                disabled={isLoading}
                aria-label="Message input"
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-text-primary placeholder-text-muted focus:outline-none disabled:opacity-50 min-h-[44px] max-h-44"
                style={{ height: 'auto' }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 176)}px`;
                }}
              />
              {/* Action row */}
              <div className="flex items-center gap-1 px-3 pb-3">
                <InputAction icon={<AttachIcon />} label="Attach" disabled title="File upload — coming soon" />
                <InputAction icon={<ContextIcon />} label="Add context" disabled title="Context injection — coming soon" />
                <InputAction icon={<TemplateSmIcon />} label="Templates" onClick={() => setShowTemplates(v => !v)} />
                <div className="flex-1" />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Send message"
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent hover:bg-accent-dim disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <p className="text-center text-text-muted text-[10px] font-mono mt-2 tracking-wide">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_HEADER: Record<string, { label: string; desc: string }> = {
  welcome:           { label: 'Welcome',            desc: 'Introduce your idea to Frank' },
  business_intent:   { label: 'Business Intent',    desc: 'Why does this idea matter?' },
  intake:            { label: 'Requirements Intake', desc: 'Define the problem space' },
  backlog_generated: { label: 'Backlog Generated',   desc: 'Your epics & stories are ready' },
  export:            { label: 'Export',              desc: 'Push your backlog to GitHub' },
};

const STARTERS = [
  { label: 'Invoice tracker for freelancers',    text: 'I want to build an app that helps freelancers track invoices and get paid faster.' },
  { label: 'Team knowledge base',               text: "I want to build an internal knowledge base where my team can find answers instantly, without asking Slack." },
  { label: 'Startup waitlist platform',          text: 'I want to build a waitlist platform that helps startups build buzz and validate demand before launch.' },
];

const TEMPLATES = [
  { label: 'SaaS Product',           text: 'I want to build a SaaS product that [does X] for [target users].' },
  { label: 'Internal Tool',          text: 'I want to build an internal tool for my team to [automate/streamline X].' },
  { label: 'Marketplace',            text: 'I want to create a marketplace that connects [buyers] with [sellers].' },
  { label: 'Mobile App',             text: 'I want to build a mobile app that helps [users] do [X].' },
  { label: 'API / Platform',         text: 'I want to build an API/platform that enables developers to [X].' },
];

const FEATURES = [
  { icon: '🎯', label: 'Strategic' },
  { icon: '📋', label: 'Structured' },
  { icon: '📊', label: 'Prioritised' },
  { icon: '🚀', label: 'GitHub-ready' },
];

// ─── Welcome screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onSelect, onOpenTemplates }: { onSelect: (text: string) => void; onOpenTemplates?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6 animate-fade-in select-none">
      {/* Greeting */}
      <div className="mb-6">
        <div className="text-4xl mb-3">👋</div>
        <h1 className="text-2xl font-bold text-text-primary leading-tight">
          Hi, I'm <span className="text-agent-violet">Frank</span>
        </h1>
        <p className="text-text-muted text-sm mt-2 max-w-xs leading-relaxed">
          From idea to backlog in minutes. No BA or PM experience required.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm mb-8">
        {[
          { icon: '🎯', label: 'Strategic Guidance',  color: 'border-agent-violet/30 bg-agent-violet/5' },
          { icon: '📋', label: 'Project Planning',    color: 'border-blue-500/30 bg-blue-500/5' },
          { icon: '📊', label: 'Prioritization',      color: 'border-success/30 bg-success/5' },
          { icon: '🚀', label: 'Actionable Output',   color: 'border-accent/30 bg-accent/5' },
        ].map(({ icon, label, color }) => (
          <div key={label} className={`rounded-lg border p-3 text-left ${color}`}>
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-xs font-medium text-text-secondary">{label}</div>
          </div>
        ))}
      </div>

      {/* Starter prompts */}
      <div className="w-full max-w-sm">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-3">
          What would you like to start with?
        </p>
        <div className="space-y-2">
          {STARTERS.map(s => (
            <button
              key={s.label}
              onClick={() => onSelect(s.text)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-surface hover:border-agent-violet/40 hover:bg-surface-2 text-left text-xs text-text-secondary transition-colors group"
            >
              <span className="flex-1 leading-snug">{s.label}</span>
              <span className="text-text-muted group-hover:text-agent-violet transition-colors shrink-0">→</span>
            </button>
          ))}
        </div>
        {onOpenTemplates && (
          <button
            onClick={onOpenTemplates}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] text-text-muted hover:text-agent-violet transition-colors py-1.5 font-mono"
          >
            <span>Browse templates</span>
            <span>→</span>
          </button>
        )}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {FEATURES.map(f => (
          <span key={f.label} className="flex items-center gap-1 text-[10px] text-text-muted bg-surface-2 border border-border px-2.5 py-1 rounded-full">
            {f.icon} {f.label}
          </span>
        ))}
      </div>

      {/* Privacy */}
      <div className="mt-6 flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
        <span>🔒</span>
        <span>Sessions are private. No account needed.</span>
      </div>
    </div>
  );
}

// ─── TemplatesPicker ─────────────────────────────────────────────────────────

function TemplatesPicker({ onSelect, onClose }: { onSelect: (text: string) => void; onClose: () => void }) {
  return (
    <div className="mb-2 max-w-3xl mx-auto rounded-xl border border-border bg-surface-2 p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Templates</p>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xs px-2">✕</button>
      </div>
      <div className="space-y-1">
        {TEMPLATES.map(t => (
          <button
            key={t.label}
            onClick={() => onSelect(t.text)}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface text-xs text-text-secondary hover:text-text-primary transition-colors group"
          >
            <span className="flex-1">{t.label}</span>
            <span className="text-text-muted group-hover:text-accent transition-colors shrink-0 text-[10px] font-mono">use →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── InputAction ─────────────────────────────────────────────────────────────

function InputAction({ icon, label, onClick, disabled, title }: {
  icon: ReactNode; label: string; onClick?: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono text-text-muted hover:text-text-primary hover:bg-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {icon}
      <span>{label}</span>
    </button>
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

function SendIcon() {
  return (
    <svg className="w-4 h-4 text-accent-fg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h12M9 3l5 5-5 5" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 6.5L6.5 12a3.5 3.5 0 01-5-5L7 1.5a2 2 0 013 3L4.5 10a.5.5 0 01-.7-.7L9.5 4" />
    </svg>
  );
}

function ContextIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="10" height="10" rx="1.5" />
      <path d="M5 5h4M5 7h4M5 9h2" />
    </svg>
  );
}

function TemplateSmIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="10" height="10" rx="1.5" />
      <path d="M2 5h10M5 5v7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}
