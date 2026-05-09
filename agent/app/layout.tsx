import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Idea → Agent',
  description:
    'Transform your raw idea into a developer-ready backlog with Epics, User Stories, and Acceptance Criteria.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
