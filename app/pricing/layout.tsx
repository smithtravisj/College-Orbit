import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'View College Orbit pricing plans. Start free with core features or upgrade to Premium for unlimited notes, courses, file attachments, custom themes, and more.',
  keywords: ['college orbit pricing', 'student planner pricing', 'free college dashboard', 'premium student tools', 'affordable student app'],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing - College Orbit',
    description: 'Start free or upgrade to Premium. Affordable plans for students.',
    url: 'https://collegeorbit.app/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
