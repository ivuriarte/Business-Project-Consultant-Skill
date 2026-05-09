'use client';

import { useState } from 'react';
import type { ExportRequestBody, ExportResponse } from '@/lib/types';

interface ExportButtonProps {
  sessionId: string;
  projectName?: string;
}

export function ExportButton({ sessionId, projectName }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ExportResponse | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!owner || !repo || !token) return;

    setStatus('loading');
    setResult(null);

    try {
      const body: ExportRequestBody = { sessionId, owner, repo, token };
      const res = await fetch('/api/export/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: ExportResponse = await res.json();
      setResult(data);
      setStatus(data.success ? 'success' : 'error');
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
      setStatus('error');
    }
  };

  const reset = () => {
    setOpen(false);
    setStatus('idle');
    setResult(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-border-muted hover:bg-border text-text-secondary hover:text-text-primary text-xs font-medium transition-colors"
      >
        <GitHubIcon />
        Export to GitHub
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) reset(); }}
        >
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Export to GitHub Issues</h2>
                {projectName && (
                  <p className="text-xs text-text-muted mt-0.5">{projectName}</p>
                )}
              </div>
              <button onClick={reset} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {status === 'success' && result?.issue_urls ? (
                <SuccessState result={result} onClose={reset} />
              ) : (
                <form onSubmit={handleExport} className="space-y-4">
                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5">
                      Repository owner
                    </label>
                    <input
                      type="text"
                      value={owner}
                      onChange={e => setOwner(e.target.value)}
                      placeholder="your-username"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-canvas border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5">
                      Repository name
                    </label>
                    <input
                      type="text"
                      value={repo}
                      onChange={e => setRepo(e.target.value)}
                      placeholder="my-project"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-canvas border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5">
                      GitHub Personal Access Token
                      <a
                        href="https://github.com/settings/tokens/new?scopes=repo&description=Idea+to+Agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-accent hover:underline"
                      >
                        Generate one ↗
                      </a>
                    </label>
                    <input
                      type="password"
                      value={token}
                      onChange={e => setToken(e.target.value)}
                      placeholder="ghp_…"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-canvas border border-border text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Needs <code className="text-accent">repo</code> scope. Never stored — sent once over HTTPS.
                    </p>
                  </div>

                  {status === 'error' && result?.error && (
                    <div className="px-3 py-2 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs">
                      {result.error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !owner || !repo || !token}
                    className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-canvas text-sm font-semibold transition-colors"
                  >
                    {status === 'loading' ? 'Creating issues…' : 'Create GitHub Issues'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SuccessState({ result, onClose }: { result: ExportResponse; onClose: () => void }) {
  return (
    <div className="text-center space-y-4">
      <div className="text-4xl">🎉</div>
      <div>
        <p className="text-success font-semibold text-sm">
          {result.issues_created} issues created!
        </p>
        <p className="text-text-muted text-xs mt-1">
          Your backlog is now in GitHub. Share the repo link with your dev team.
        </p>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto text-left">
        {result.issue_urls?.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-accent hover:underline truncate"
          >
            {url}
          </a>
        ))}
      </div>
      <button
        onClick={onClose}
        className="w-full py-2 rounded-lg bg-border-muted hover:bg-border text-text-primary text-sm transition-colors"
      >
        Done
      </button>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
