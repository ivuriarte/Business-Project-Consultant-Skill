'use client';

import { useState } from 'react';
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
  onClose?: () => void; // mobile close button
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

export function BacklogPanel({ backlog, sessionId, onCopyLink, copied, onClose }: BacklogPanelProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
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

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-sm font-semibold tracking-tight text-text-primary">
            Idea <span className="text-accent">→</span> Agent
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopyLink}
              title="Copy shareable session link"
              className="text-[11px] font-mono text-text-muted hover:text-accent transition-colors flex items-center gap-1"
            >
              {copied ? (
                <><span className="text-success">✓</span> Copied</>
              ) : (
                <><ShareIcon /> Share</>
              )}
            </button>
            {/* Mobile close */}
            {onClose && (
              <button onClick={onClose} className="md:hidden text-text-muted hover:text-text-primary ml-1">
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
        <div className="font-mono text-[10px] text-text-muted truncate tracking-wider">
          {sessionId}
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

      {/* ── Project name ─────────────────────────────────────────────── */}
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

      {/* ── Epics ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {hasEpics ? (
          <div className="py-2">
            <p className="px-5 font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2 mt-1">
              Backlog
            </p>
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
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="w-8 h-8 rounded-full border border-dashed border-border mx-auto mb-3 flex items-center justify-center">
              <span className="text-text-muted text-xs font-mono">?</span>
            </div>
            <p className="text-text-muted text-xs leading-relaxed">
              Your backlog will appear<br />once the agent generates it.
            </p>
          </div>
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
