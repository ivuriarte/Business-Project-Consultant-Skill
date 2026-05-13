import type { Metadata } from 'next';
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const mono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const sans = Instrument_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Frank — From Idea to Backlog in Minutes',
  description:
    'From idea to backlog in minutes. Structured epics, prioritized stories, and developer-ready output — with GitHub Issues export included.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${mono.variable} ${sans.variable}`}>
      <body className="antialiased font-sans">{children}</body>
      <Analytics />
    </html>
  );
}
