'use client';

import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Profile</h1>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Name
            </label>
            <div className="text-lg text-[var(--text)]">
              {session?.user?.name || 'Not provided'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              Email
            </label>
            <div className="text-lg text-[var(--text)]">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
