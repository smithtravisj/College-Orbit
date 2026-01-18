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
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: 'College Orbit - Your Personal College Dashboard',
    template: '%s | College Orbit',
  },
  description: 'Stay organized throughout college with College Orbit. Track assignments, deadlines, exams, courses, and more in one privacy-first dashboard.',
  keywords: ['college', 'student', 'dashboard', 'assignments', 'deadlines', 'exams', 'courses', 'planner', 'organizer', 'productivity', 'study'],
  authors: [{ name: 'College Orbit' }],
  creator: 'College Orbit',
  publisher: 'College Orbit',
  metadataBase: new URL('https://collegeorbit.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://collegeorbit.app',
    siteName: 'College Orbit',
    title: 'College Orbit - Your Personal College Dashboard',
    description: 'Stay organized throughout college with College Orbit. Track assignments, deadlines, exams, courses, and more in one privacy-first dashboard.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'College Orbit - Your Personal College Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Orbit - Your Personal College Dashboard',
    description: 'Stay organized throughout college with College Orbit. Track assignments, deadlines, exams, courses, and more in one privacy-first dashboard.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
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
        <meta name="apple-mobile-web-app-title" content="College Orbit" />
        <meta name="theme-color" content="#0b0f14" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/mask-icon.svg" color="#0b0f14" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://collegeorbit.app/#website',
                  url: 'https://collegeorbit.app',
                  name: 'College Orbit',
                  description: 'A personal, privacy-first college dashboard for tracking assignments, deadlines, exams, and courses.',
                  publisher: {
                    '@id': 'https://collegeorbit.app/#organization',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://collegeorbit.app/#organization',
                  name: 'College Orbit',
                  url: 'https://collegeorbit.app',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://collegeorbit.app/logo.png',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'College Orbit',
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'Web',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                  description: 'Stay organized throughout college with College Orbit. Track assignments, deadlines, exams, courses, and more in one privacy-first dashboard.',
                },
              ],
            }),
          }}
        />
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
