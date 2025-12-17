import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'BYU Survival Tool',
  description: 'A personal, privacy-first BYU dashboard',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ backgroundColor: 'var(--bg)' }}>
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
