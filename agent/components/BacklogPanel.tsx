'use client';

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { AgentSession, Epic } from '@/lib/types';

type BacklogState = {
  project?: AgentSession['project'];
  epics: Epic[];
  stage: AgentSession['stage'];
};

interface BacklogPanelProps {
  backlog: BacklogState;
  sessionId: string;
  onCopyLink: () => void;
  copied: boolean;
  onClose?: () => void;
  onOpenTemplates?: () => void;
  onSelectExample?: (text: string) => void;
}

const STAGES: { key: AgentSession['stage']; label: string; desc: string }[] = [
  { key: 'welcome',          label: 'Start',   desc: 'Introduce your idea' },
  { key: 'business_intent',  label: 'Intent',  desc: 'Why it matters' },
  { key: 'intake',           label: 'Intake',  desc: 'Define the problem' },
  { key: 'backlog_generated',label: 'Backlog', desc: 'Epics & stories' },
  { key: 'export',           label: 'Export',  desc: 'Push to GitHub' },
];

const STAGE_ORDER: Record<AgentSession['stage'], number> = {
  welcome: 0, business_intent: 1, intake: 2, backlog_generated: 3, export: 4,
};

const EXAMPLES = [
  'I want to build a mobile app where parents can track their kids\' after-school activities.',
  'I have an idea for a SaaS tool that helps small restaurants manage online orders and delivery.',
  'I want to create a platform that connects musicians with local venues for gigs and bookings.',
];

export function BacklogPanel({
  backlog,
  sessionId,
  onCopyLink,
  copied,
  onClose,
  onOpenTemplates,
  onSelectExample,
}: BacklogPanelProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [showExamples, setShowExamples] = useState(false);
  const currentIdx = STAGE_ORDER[backlog.stage] ?? 0;
  const hasEpics = backlog.epics.length > 0;
  const totalStories = backlog.epics.reduce((n, e) => n + e.stories.length, 0);
  const mvpCount = backlog.epics.reduce((n, e) => n + e.stories.filter(s => s.phase === 'MVP').length, 0);

  const toggleEpic = (id: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <aside className="flex flex-col w-72 shrink-0 h-full bg-surface border-r border-border overflow-hidden">

      {/* ── Header: Frank persona ────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between">
          {/* Avatar + name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' }}>
              F
            </div>
            <div>
              <div className="font-semibold text-sm text-text-primary leading-tight">Frank</div>
              <div className="text-[10px] text-text-muted leading-tight">From idea to backlog in minutes.</div>
            </div>
          </div>
          {/* Close (mobile) */}
          {onClose && (
            <button onClick={onClose} className="md:hidden text-text-muted hover:text-text-primary mt-0.5">
              <CloseIcon />
            </button>
          )}
        </div>
        {/* Share row */}
        <div className="flex items-center justify-between mt-3">
          <div className="font-mono text-[9px] text-text-muted truncate max-w-[120px]">{sessionId.slice(0, 16)}…</div>
          <button
            onClick={onCopyLink}
            title="Copy shareable link"
            className="text-[10px] font-mono flex items-center gap-1 text-text-muted hover:text-accent transition-colors"
          >
            {copied ? <><span className="text-success">✓</span> Copied</> : <><ShareIcon /> Share</>}
          </button>
        </div>
      </div>

      {/* ── Stage progress ────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-3">Progress</p>
        <div className="space-y-2">
          {STAGES.map((stage, i) => {
            const done   = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={stage.key} className="flex items-center gap-3">
                {/* indicator */}
                <div className={clsx(
                  'w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-mono font-bold transition-all',
                  done   && 'bg-accent/20 text-accent border border-accent/40',
                  active && 'bg-accent text-accent-fg ring-2 ring-accent/20',
                  !done && !active && 'border border-border text-text-muted'
                )}>
                  {done ? '✓' : i + 1}
                </div>
                <div>
                  <div className={clsx(
                    'text-xs font-medium leading-tight',
                    done   && 'text-accent/80',
                    active && 'text-accent',
                    !done && !active && 'text-text-muted'
                  )}>{stage.label}</div>
                  {active && (
                    <div className="text-[10px] text-text-muted mt-0.5">{stage.desc}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-border">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2">Quick Actions</p>
        <div className="space-y-0.5">
          <QuickAction
            icon={<IdeaIcon />}
            label="View Example Ideas"
            active={showExamples}
            onClick={() => setShowExamples(v => !v)}
          />
          {showExamples && (
            <div className="mt-1 ml-6 space-y-1 pb-1">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { onSelectExample?.(ex); setShowExamples(false); }}
                  className="w-full text-left text-[10px] text-text-secondary hover:text-text-primary leading-snug py-1 px-2 rounded hover:bg-surface-2 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
          <QuickAction
            icon={<TemplateIcon />}
            label="Templates"
            onClick={onOpenTemplates}
          />
        </div>
      </div>

      {/* ── Scrollable main ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!hasEpics ? (
          /* About Frank */
          <div className="px-5 py-6">
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-3">About Frank</p>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Answer 3 questions about your idea. Frank generates structured epics, stories, priorities, and a GitHub-ready export — in minutes.
            </p>
            <div className="space-y-2">
              {[
                { icon: '🎯', text: 'Business intent elicitation (2 min)' },
                { icon: '📋', text: 'Epics + stories with acceptance criteria' },
                { icon: '📊', text: 'MoSCoW + value scoring, auto-calculated' },
                { icon: '🚀', text: 'One-click GitHub Issues export' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <span className="text-sm shrink-0 mt-px">{icon}</span>
                  <span className="text-[11px] text-text-muted leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Project + Epics */
          <>
            {backlog.project && (
              <div className="px-5 py-3 border-b border-border">
                <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1">Project</p>
                <p className="text-sm font-semibold text-text-primary truncate">{backlog.project.name}</p>
                {backlog.project.problem_statement && (
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed line-clamp-2">
                    {backlog.project.problem_statement}
                  </p>
                )}
              </div>
            )}
            <div className="py-2">
              <p className="px-5 font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2 mt-1">Backlog</p>
              {backlog.epics.map((epic, idx) => (
                <EpicRow
                  key={epic.id}
                  epic={epic}
                  index={idx + 1}
                  expanded={expandedEpics.has(epic.id)}
                  onToggle={() => toggleEpic(epic.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Stats footer ─────────────────────────────────────────────── */}
      {hasEpics && (
        <div className="px-5 py-3 border-t border-border bg-canvas">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Epics"   value={backlog.epics.length} />
            <Stat label="Stories" value={totalStories} />
            <Stat label="MVP"     value={mvpCount} accent />
          </div>
        </div>
      )}

    </aside>
  );
}
// ─── QuickAction ──────────────────────────────────────────────────────────────────────────────

function QuickAction({
  icon, label, onClick, active, disabled, disabledReason,
}: {
  icon: ReactNode; label: string; onClick?: () => void;
  active?: boolean; disabled?: boolean; disabledReason?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={disabled ? disabledReason : undefined}
      className={clsx(
        'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs transition-colors text-left',
        disabled
          ? 'text-text-muted/40 cursor-not-allowed'
          : active
          ? 'bg-surface-2 text-text-primary'
          : 'text-text-muted hover:text-text-primary hover:bg-surface-2 cursor-pointer',
      )}
    >
      <span className={clsx('shrink-0', disabled && 'opacity-30')}>{icon}</span>
      <span className="flex-1">{label}</span>
      {!disabled && <ChevronRightIcon />}
      {disabled && <span className="text-[9px] font-mono opacity-40">soon</span>}
    </button>
  );
}
// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className={clsx('text-base font-mono font-semibold', accent ? 'text-accent' : 'text-text-primary')}>
        {value}
      </div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-text-muted mt-0.5">{label}</div>
    </div>
  );
}

function EpicRow({ epic, index, expanded, onToggle }: {
  epic: Epic; index: number; expanded: boolean; onToggle: () => void;
}) {
  const priorityDot: Record<string, string> = {
    'Must Have':   'bg-danger',
    'Should Have': 'bg-warning',
    'Could Have':  'bg-success',
  };

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-surface-2 transition-colors text-left group"
      >
        <span className="font-mono text-[10px] text-text-muted shrink-0 w-5 text-right">{index}</span>
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0 mt-px', priorityDot[epic.priority] ?? 'bg-text-muted')} />
        <span className="flex-1 text-xs text-text-primary truncate font-medium">{epic.name}</span>
        <span className="text-[10px] font-mono text-text-muted shrink-0">{epic.stories.length}</span>
        <ChevronIcon expanded={expanded} />
      </button>

      {expanded && (
        <div className="pb-2 animate-fade-in">
          {epic.stories.map(story => (
            <div key={story.id} className="flex items-start gap-2 pl-14 pr-4 py-1 hover:bg-surface-2/50 transition-colors">
              <span className={clsx(
                'mt-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 border',
                story.phase === 'MVP'
                  ? 'bg-danger/10 border-danger/20 text-danger'
                  : 'bg-border-muted border-border text-text-muted'
              )}>
                {story.phase === 'MVP' ? 'MVP' : story.phase.slice(0, 3).toUpperCase()}
              </span>
              <span className="text-[11px] text-text-secondary leading-snug">{story.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={clsx('w-3 h-3 text-text-muted shrink-0 transition-transform duration-200', expanded && 'rotate-90')}
      viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
    >
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-3 h-3 text-text-muted/50 shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}

function IdeaIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="6" r="3.5" />
      <path d="M5.5 11h3M6 12.5h2" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="10" height="10" rx="1.5" />
      <path d="M2 5h10M5 5v7" />
    </svg>
  );
}



function ShareIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2H10V4M10 2L5 7M5 3H2V10H9V7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
