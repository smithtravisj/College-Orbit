import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
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
  keywords: ['college', 'student', 'dashboard', 'assignments', 'deadlines', 'exams', 'courses', 'planner', 'organizer', 'productivity', 'study', 'homework tracker', 'college planner', 'student organizer', 'academic planner', 'GPA calculator', 'flashcards', 'note taking', 'pomodoro timer'],
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
    <html lang="en" className={inter.className}>
      <head>
        <meta name="color-scheme" content="light dark" />
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
                    width: 512,
                    height: 512,
                  },
                  contactPoint: {
                    '@type': 'ContactPoint',
                    email: 'collegeorbit@protonmail.com',
                    contactType: 'customer support',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://collegeorbit.app/#application',
                  name: 'College Orbit',
                  applicationCategory: 'EducationalApplication',
                  operatingSystem: 'Web, iOS, Android',
                  offers: [
                    {
                      '@type': 'Offer',
                      name: 'Free',
                      price: '0',
                      priceCurrency: 'USD',
                      description: 'Core features including dashboard, task tracking, up to 10 notes, and up to 5 courses',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Premium Monthly',
                      price: '3',
                      priceCurrency: 'USD',
                      billingIncrement: 'P1M',
                      description: 'Unlimited notes, courses, file attachments, custom themes, and more',
                    },
                  ],
                  description: 'Stay organized throughout college with College Orbit. Track assignments, deadlines, exams, courses, and more in one privacy-first dashboard.',
                  featureList: 'Assignment tracking, Deadline reminders, Exam scheduling, Course management, Note taking, GPA calculator, Flashcards with spaced repetition, Pomodoro timer, File converter, Calendar sync',
                  screenshot: 'https://collegeorbit.app/og-image.png',
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8',
                    ratingCount: '150',
                    bestRating: '5',
                    worstRating: '1',
                  },
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://collegeorbit.app/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'Is College Orbit free?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes, College Orbit offers a free tier with core features including dashboard, task tracking, exam scheduling, up to 10 notes, and up to 5 courses. Premium plans start at $3/month for unlimited access.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What features does College Orbit offer?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'College Orbit helps you track assignments and deadlines, schedule exams with reminders, manage courses, take notes, use a full calendar view, and access productivity tools like GPA calculator and Pomodoro timer.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Is my data private and secure?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Yes, College Orbit is privacy-first. Your data is encrypted and stored securely. We never sell your data or share it with third parties for advertising purposes.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
        <style>{`
          html {
            background-color: var(--bg, #0b0f14);
            color: var(--text, #e6edf6);
          }
        `}</style>
      </head>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        {/* SEO content for crawlers - visually hidden but in initial HTML */}
        <div
          id="seo-content"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          <h1>College Orbit - Your Personal College Dashboard</h1>
          <p>
            Stay organized throughout college with College Orbit, the privacy-first
            student dashboard designed to help you succeed. Track assignments, manage
            deadlines, schedule exams, organize courses, and boost your productivity
            with powerful tools built specifically for college students.
          </p>
          <h2>Key Features</h2>
          <p>
            Assignment and deadline tracking with smart reminders keeps you on top of
            your coursework. Schedule exams with countdown timers so you never miss a
            test. Manage all your courses with grade tracking and GPA calculation.
            Take notes with full markdown support and organize them in folders.
          </p>
          <p>
            Study smarter with flashcards featuring spaced repetition learning based
            on the proven SM-2 algorithm. Stay focused with the Pomodoro timer for
            productive study sessions. Sync your calendar with Google Calendar and
            integrate with your school's LMS including Canvas, Blackboard, Moodle,
            and Brightspace.
          </p>
          <h2>Why Choose College Orbit</h2>
          <p>
            College Orbit is built for students who value privacy and simplicity.
            Your data is encrypted and never sold to third parties. Unlike other
            apps, we focus on what matters most: helping you stay organized and
            succeed in your academic journey.
          </p>
          <p>
            Start free with core features including the dashboard, task tracking,
            exam scheduling, up to ten notes, and up to five courses. Upgrade to
            Premium for unlimited access, custom university themes, file attachments,
            and advanced features starting at just three dollars per month or
            twenty-four dollars per year.
          </p>
          <h2>Get Started Today</h2>
          <p>
            Join thousands of college students who use College Orbit to stay
            organized and achieve their academic goals. Sign up for free in seconds
            and take control of your college experience. No credit card required.
          </p>
        </div>
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
