import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'View College Orbit pricing plans. Start free with core features or upgrade to Premium for unlimited notes, full calendar, file attachments, and more.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
