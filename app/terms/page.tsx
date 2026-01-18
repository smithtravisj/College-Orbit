import TermsContent from './TermsContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for College Orbit. Learn about acceptable use, user accounts, data ownership, and your rights when using our educational productivity platform.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsContent />;
}
