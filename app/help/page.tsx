import HelpContent from './HelpContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & FAQs',
  description: 'Get help with College Orbit. Find answers to frequently asked questions, learn how features work, and troubleshoot common issues.',
  alternates: {
    canonical: '/help',
  },
};

export default function HelpPage() {
  return <HelpContent />;
}
