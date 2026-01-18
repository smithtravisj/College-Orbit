import { Suspense } from 'react';
import { LoginForm } from './LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to College Orbit to access your personal college dashboard. Track assignments, deadlines, exams, and courses.',
  alternates: {
    canonical: '/login',
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
