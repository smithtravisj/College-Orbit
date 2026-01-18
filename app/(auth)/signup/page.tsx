import SignupForm from './SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free College Orbit account. Track assignments, deadlines, exams, and courses in one privacy-first dashboard.',
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
