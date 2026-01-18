import PrivacyContent from './PrivacyContent';
import type { Metadata } from 'next';

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
