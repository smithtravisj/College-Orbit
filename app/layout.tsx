import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'BYU Survival Tool',
  description: 'A personal, privacy-first BYU dashboard',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col md:flex-row">
          <Navigation />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
