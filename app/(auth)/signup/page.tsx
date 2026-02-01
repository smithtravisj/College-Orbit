import SignupForm from './SignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free College Orbit account. Track assignments, deadlines, exams, and courses in one privacy-first dashboard built for college students.',
  keywords: ['sign up college orbit', 'create student account', 'free college planner', 'student dashboard signup'],
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Sign Up - College Orbit',
    description: 'Create your free account and start organizing your college life.',
    url: 'https://collegeorbit.app/signup',
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
