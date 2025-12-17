import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
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
        <Providers>
          <div className="min-h-screen bg-[var(--bg)] md:grid md:grid-cols-[264px_1fr]">
            <Navigation />
            <main className="min-w-0 pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
