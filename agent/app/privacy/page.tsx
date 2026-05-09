import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Idea → Agent',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-text-primary px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Back nav */}
        <div className="mb-10">
          <Link href="/" className="font-mono text-xs text-text-muted hover:text-accent transition-colors">
            ← Back
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Legal</p>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">Privacy Policy</h1>
          <p className="text-text-muted text-sm mt-2 font-mono">Effective: 2025 · Last updated: 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">What We Collect</h2>
            <p>
              This tool collects only the minimum data required to operate:
            </p>
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">Session data.</strong> Your conversation messages and generated backlog are stored in Redis with a 30-day TTL. After 30 days, all data is automatically deleted.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">Anonymous analytics.</strong> Vercel Analytics collects aggregate page-view data (no cookies, no cross-site tracking, no personal identifiers).</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">Rate-limit keys.</strong> Your IP address is hashed to enforce abuse limits. Hashes expire automatically and are not linked to any identity.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">What We Do Not Collect</h2>
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              {['Your name, email, or any account information', 'Cookies or persistent browser identifiers', 'Payment or financial data', 'GitHub tokens (used once per request, discarded immediately)'].map(item => (
                <li key={item} className="flex gap-3 items-start">
                  <span className="text-text-muted mt-0.5 shrink-0 font-mono text-xs">×</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">Third-Party Services</h2>
            <ul className="mt-2 space-y-1.5 list-none pl-0">
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">OpenAI.</strong> Messages are sent to OpenAI to generate responses. See <a href="https://openai.com/policies/privacy-policy" className="text-accent hover:underline" target="_blank" rel="noreferrer">OpenAI Privacy Policy</a>.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">Upstash Redis.</strong> Session data is stored via Upstash. See <a href="https://upstash.com/trust/privacy.pdf" className="text-accent hover:underline" target="_blank" rel="noreferrer">Upstash Privacy Policy</a>.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5 shrink-0 font-mono text-xs">→</span>
                <span><strong className="text-text-primary">Vercel.</strong> The app is hosted on Vercel. See <a href="https://vercel.com/legal/privacy-policy" className="text-accent hover:underline" target="_blank" rel="noreferrer">Vercel Privacy Policy</a>.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">Your Rights</h2>
            <p>
              You can delete your session at any time. Each session is identified by the ID in your URL.
              To delete all associated data, send a <code className="text-accent bg-accent/10 px-1 rounded text-xs">DELETE</code> request to{' '}
              <code className="text-accent bg-accent/10 px-1 rounded text-xs">/api/session/{'<your-session-id>'}</code>.
              All session data (messages, backlog, stage) is removed immediately.
            </p>
            <p className="mt-3">
              Remaining data (anonymous analytics aggregates) cannot be attributed to you and cannot be individually deleted.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">Data Retention</h2>
            <p>Session data stored in Redis expires automatically after <strong className="text-text-primary">30 days</strong> of inactivity. No manual deletion is required — the data simply ceases to exist after the TTL expires.</p>
          </section>

          <section>
            <h2 className="text-sm font-mono font-semibold uppercase tracking-widest text-text-muted mb-3">Contact</h2>
            <p>This is an open-source project. For questions, open an issue on the GitHub repository.</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-6 text-[11px] font-mono text-text-muted">
          <Link href="/" className="hover:text-accent transition-colors">← Home</Link>
          <Link href="/terms" className="hover:text-accent transition-colors">Terms of Use →</Link>
        </div>
      </div>
    </div>
  );
}
