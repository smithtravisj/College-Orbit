import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

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
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} style={{ backgroundColor: '#0b0f14' }}>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="College Survival" />
        <meta name="theme-color" content="#0b0f14" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/mask-icon.svg" color="#0b0f14" />
        <style>{`
          @supports (color-scheme: dark) {
            :root { color-scheme: dark; }
          }
          html {
            background-color: #0b0f14 !important;
            color: #e6edf6 !important;
          }
        `}</style>
      </head>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
