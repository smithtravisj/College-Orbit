import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BYU Survival Tool',
  description: 'A personal, privacy-first BYU dashboard',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} style={{ backgroundColor: 'var(--bg)' }}>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="flex min-h-screen flex-col md:flex-row bg-[var(--bg)]">
          <Navigation />
          <main className="flex-1 pb-20 md:pb-0 md:overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
