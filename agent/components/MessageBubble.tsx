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

  // Tool invocation — persist_backlog
  if (message.toolInvocations && message.toolInvocations.length > 0) {
    const inv = message.toolInvocations[0];
    if (inv.toolName === 'persist_backlog') {
      const isDone = inv.state === 'result';
      return (
        <div className="flex justify-center my-4 animate-fade-in">
          <div className={clsx(
            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono border transition-all duration-300',
            isDone
              ? 'bg-success/8 border-success/20 text-success'
              : 'bg-accent/8 border-accent/20 text-accent'
          )}>
            {isDone
              ? <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              : <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" />
            }
            {isDone ? 'Backlog saved to session' : 'Saving backlog…'}
          </div>
        </div>
      );
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1 animate-slide-up">
        <div className="max-w-[72%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-surface-2 border border-border text-text-primary text-sm leading-relaxed font-sans">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-2 animate-slide-up max-w-3xl">
      {/* Amber accent rule */}
      <div className="w-0.5 self-stretch bg-accent/30 rounded-full shrink-0 mt-1" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-accent/70 uppercase tracking-widest mb-1.5">
          Agent
        </div>
        <div className="prose prose-sm max-w-none
          prose-p:text-text-primary prose-p:leading-relaxed prose-p:my-1.5
          prose-headings:text-text-primary prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4
          prose-strong:text-text-primary prose-strong:font-semibold
          prose-ul:my-2 prose-ol:my-2
          prose-li:text-text-primary prose-li:my-0.5
          prose-table:my-3
          prose-hr:my-4
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
