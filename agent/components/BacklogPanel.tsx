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
}

const STAGES: { key: AgentSession['stage']; label: string }[] = [
  { key: 'welcome', label: 'Start' },
  { key: 'business_intent', label: 'Intent' },
  { key: 'intake', label: 'Intake' },
  { key: 'backlog_generated', label: 'Backlog' },
  { key: 'export', label: 'Export' },
];

const STAGE_ORDER: Record<AgentSession['stage'], number> = {
  welcome: 0,
  business_intent: 1,
  intake: 2,
  backlog_generated: 3,
  export: 4,
};

export function BacklogPanel({ backlog, sessionId, onCopyLink, copied }: BacklogPanelProps) {
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const currentStageIndex = STAGE_ORDER[backlog.stage] ?? 0;
  const hasProject = Boolean(backlog.project);
  const hasEpics = backlog.epics.length > 0;

  const toggleEpic = (id: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-72 shrink-0 flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold tracking-tight text-text-primary">
            Idea <span className="text-accent">→</span> Agent
          </span>
          <button
            onClick={onCopyLink}
            title="Copy shareable link"
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            {copied ? '✓ Copied' : '⎘ Share'}
          </button>
        </div>
        <p className="text-text-muted text-xs mt-0.5 font-mono truncate">{sessionId}</p>
      </div>

      {/* Stage progress */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Progress</p>
        <div className="space-y-1.5">
          {STAGES.map((stage, i) => {
            const done = i < currentStageIndex;
            const active = i === currentStageIndex;
            return (
              <div key={stage.key} className="flex items-center gap-2.5">
                <div className={clsx(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0',
                  done && 'bg-success text-canvas',
                  active && 'bg-accent text-canvas ring-2 ring-accent/30',
                  !done && !active && 'bg-border-muted text-text-muted'
                )}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={clsx(
                  'text-xs',
                  done && 'text-success',
                  active && 'text-accent font-medium',
                  !done && !active && 'text-text-muted'
                )}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project info */}
      {hasProject && (
        <div className="px-5 py-3 border-b border-border">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Project</p>
          <p className="text-text-primary text-sm font-medium truncate">{backlog.project!.name}</p>
          <p className="text-text-muted text-xs mt-0.5 line-clamp-2 leading-relaxed">
            {backlog.project!.problem_statement}
          </p>
        </div>
      )}

      {/* Epics list */}
      <div className="flex-1 overflow-y-auto">
        {hasEpics ? (
          <div className="py-2">
            <p className="px-5 text-text-muted text-xs uppercase tracking-wider mb-2 mt-1">
              Epics ({backlog.epics.length})
            </p>
            {backlog.epics.map(epic => (
              <EpicRow
                key={epic.id}
                epic={epic}
                expanded={expandedEpics.has(epic.id)}
                onToggle={() => toggleEpic(epic.id)}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <p className="text-text-muted text-xs leading-relaxed">
              Your backlog will appear here once the agent generates it.
            </p>
          </div>
        )}
      </div>

      {/* Stats footer */}
      {hasEpics && (
        <div className="px-5 py-3 border-t border-border bg-canvas">
          <div className="flex justify-between text-xs text-text-muted">
            <span>{backlog.epics.length} Epics</span>
            <span>
              {backlog.epics.reduce((n, e) => n + e.stories.length, 0)} Stories
            </span>
            <span>
              {backlog.epics.reduce(
                (n, e) => n + e.stories.filter(s => s.phase === 'MVP').length,
                0
              )} MVP
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Epic row with expandable stories ────────────────────────────────────────

function EpicRow({ epic, expanded, onToggle }: { epic: Epic; expanded: boolean; onToggle: () => void }) {
  const priorityColors: Record<string, string> = {
    'Must Have': 'bg-danger/80',
    'Should Have': 'bg-warning/80',
    'Could Have': 'bg-success/80',
  };

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-5 py-2 hover:bg-border-muted transition-colors text-left group"
      >
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', priorityColors[epic.priority] ?? 'bg-text-muted')} />
        <span className="flex-1 text-xs text-text-primary truncate font-medium">{epic.name}</span>
        <span className="text-text-muted text-xs shrink-0">{epic.stories.length}</span>
        <span className="text-text-muted text-xs shrink-0">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="pl-9 pr-4 pb-2 space-y-1">
          {epic.stories.map(story => (
            <div key={story.id} className="flex items-start gap-2 py-1">
              <span className={clsx(
                'mt-0.5 text-[9px] font-mono px-1 rounded shrink-0',
                story.phase === 'MVP' ? 'bg-danger/15 text-danger' : 'bg-border-muted text-text-muted'
              )}>
                {story.phase === 'MVP' ? 'MVP' : story.phase[0]}
              </span>
              <span className="text-xs text-text-secondary leading-tight">{story.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
