import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import LandingPage from '@/components/LandingPage';
import AuthenticatedDashboard from '@/components/AuthenticatedDashboard';

export default async function HomePage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    return <LandingPage />;
  }

  return <AuthenticatedDashboard />;
}
