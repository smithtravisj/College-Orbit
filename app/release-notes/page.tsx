import ReleaseNotesContent from './ReleaseNotesContent';
import type { Metadata } from 'next';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Release Notes',
  description: 'View the changelog and release history for College Orbit. See what\'s new, bug fixes, and improvements in each version.',
  alternates: {
    canonical: '/release-notes',
  },
};

export default function ReleaseNotesPage() {
  return <ReleaseNotesContent />;
}
