'use client';

import type { Message } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Show tool invocation status inline
  if (message.toolInvocations && message.toolInvocations.length > 0) {
    const inv = message.toolInvocations[0];
    if (inv.toolName === 'persist_backlog') {
      const isDone = inv.state === 'result';
      return (
        <div className="flex justify-center my-3 animate-fade-in">
          <div className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors',
            isDone
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-accent/10 border-accent/30 text-accent'
          )}>
            <span>{isDone ? '✓' : '◌'}</span>
            <span>{isDone ? 'Backlog saved to session' : 'Saving backlog…'}</span>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={clsx('flex items-start gap-3 px-2 py-1 animate-slide-up', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold',
        isUser
          ? 'bg-accent/20 text-accent'
          : 'bg-border text-text-secondary'
      )}>
        {isUser ? 'Y' : 'A'}
      </div>

      {/* Bubble */}
      <div className={clsx(
        'max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed',
        isUser
          ? 'rounded-tr-sm bg-accent/15 border border-accent/25 text-text-primary'
          : 'rounded-tl-sm bg-surface border border-border text-text-primary'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-text-primary prose-headings:font-semibold prose-strong:text-text-primary prose-code:text-accent prose-pre:bg-border-muted prose-pre:border prose-pre:border-border prose-table:text-xs prose-td:py-1 prose-th:py-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
