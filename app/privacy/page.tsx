import PrivacyContent from './PrivacyContent';
import type { Metadata } from 'next';

// Revalidate this static page every 24 hours
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how College Orbit collects, uses, and protects your personal information. We prioritize your privacy with secure data storage and full user control.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
