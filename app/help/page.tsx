import HelpContent from './HelpContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help & FAQs',
  description: 'Get help with College Orbit. Find answers to frequently asked questions about assignments, deadlines, exams, flashcards, GPA calculator, and more.',
  keywords: ['college orbit help', 'student planner faq', 'how to use college orbit', 'college dashboard help', 'assignment tracker help'],
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: 'Help & FAQs - College Orbit',
    description: 'Find answers to frequently asked questions and learn how features work.',
    url: 'https://collegeorbit.app/help',
  },
};

export default function HelpPage() {
  return <HelpContent />;
}
