'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';

interface ExportButtonProps {
  sessionId: string;
  projectName?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ExportButton({ sessionId, projectName }: ExportButtonProps) {
  const [open, setOpen]           = useState(false);
  const [owner, setOwner]         = useState('');
  const [repo, setRepo]           = useState('');
  const [token, setToken]         = useState('');
  const [status, setStatus]       = useState<Status>('idle');
  const [message, setMessage]     = useState('');
  const [issueCount, setIssueCount] = useState(0);
  const firstInputRef             = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setMessage('');
    setIssueCount(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  // Focus first field when modal opens
  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [open]);

  const handleOpen = () => {
    reset();
    setOpen(true);
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner.trim() || !repo.trim() || !token.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/export/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, owner: owner.trim(), repo: repo.trim(), token }),
      });

      const data = await res.json() as {
        success?: boolean;
        count?: number;
        issues_created?: number;
        error?: string;
        details?: string;
      };

      if (!res.ok || !data.success) {
        setStatus('error');
        setMessage(data.details ?? data.error ?? 'Export failed. Check your token and repo name.');
        return;
      }

      setStatus('success');
      setIssueCount(data.count ?? data.issues_created ?? 0);
      setToken('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-border border border-border text-text-secondary hover:text-text-primary text-xs font-mono transition-colors"
        aria-label="Export backlog to GitHub Issues"
      >
        <GitHubIcon />
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Export to GitHub Issues"
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Modal panel */}
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl animate-slide-up overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-text-primary font-mono">
                  Export → GitHub Issues
                </h2>
                {projectName && (
                  <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-xs">{projectName}</p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
                  <path d="M2 2l10 10M12 2l-10 10" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === 'success' ? (
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-3">
                    <svg viewBox="0 0 20 20" className="w-5 h-5 text-success" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10l5 5 7-7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {issueCount} issue{issueCount !== 1 ? 's' : ''} created
                  </p>
                  <p className="text-xs text-text-muted mb-5">
                    View at{' '}
                    <a
                      href={`https://github.com/${owner}/${repo}/issues`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      {owner}/{repo}/issues
                    </a>
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary hover:text-text-primary text-xs font-mono transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleExport} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="export-owner" className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                        Owner
                      </label>
                      <input
                        ref={firstInputRef}
                        id="export-owner"
                        type="text"
                        value={owner}
                        onChange={e => setOwner(e.target.value)}
                        placeholder="username"
                        disabled={status === 'loading'}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-text-primary text-xs font-mono placeholder-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="export-repo" className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                        Repository
                      </label>
                      <input
                        id="export-repo"
                        type="text"
                        value={repo}
                        onChange={e => setRepo(e.target.value)}
                        placeholder="my-repo"
                        disabled={status === 'loading'}
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-text-primary text-xs font-mono placeholder-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="export-token" className="block text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                      GitHub Token
                    </label>
                    <input
                      id="export-token"
                      type="password"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="ghp_…"
                      disabled={status === 'loading'}
                      autoComplete="off"
                      className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-text-primary text-xs font-mono placeholder-text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/10 transition-all disabled:opacity-50"
                    />
                    <p className="text-[10px] text-text-muted mt-1">
                      Needs <code className="text-accent bg-accent/10 px-1 rounded">issues: write</code> scope
                    </p>
                    <p className="text-[10px] text-success/80 mt-1 flex items-center gap-1">
                      <span>🔒</span> Your token is never stored — used for this request only.
                    </p>
                  </div>

                  {status === 'error' && (
                    <p className="text-xs text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2 animate-fade-in">
                      {message}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2.5 rounded-lg border border-border bg-transparent hover:bg-surface-2 text-text-secondary text-xs font-mono transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'loading' || !owner.trim() || !repo.trim() || !token.trim()}
                      className={clsx(
                        'flex-1 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all',
                        status === 'loading'
                          ? 'bg-accent/40 text-accent-fg cursor-wait'
                          : 'bg-accent hover:bg-accent-dim text-accent-fg disabled:opacity-40 disabled:cursor-not-allowed'
                      )}
                    >
                      {status === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                          <SpinnerIcon />
                          Exporting…
                        </span>
                      ) : 'Export Issues →'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {status !== 'success' && (
              <div className="px-6 py-3 bg-canvas border-t border-border">
                <p className="text-[10px] text-text-muted font-mono">
                  Your token is never stored — used only for this request and discarded immediately.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
        .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
        -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27
        .68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12
        .51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48
        0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
    </svg>
  );
}
