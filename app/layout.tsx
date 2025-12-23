import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';
import FaviconSwitcher from '@/components/FaviconSwitcher';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'College Survival Tool',
  description: 'A personal, privacy-first college dashboard',
  icons: {
    icon: '/favicon-light.svg',
    apple: '/favicon-light.svg',
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
          <FaviconSwitcher />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
