'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    // Check if user has localStorage data
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('byu-survival-tool-data');
      setHasLocalData(!!stored);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create user account
      const signupRes = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!signupRes.ok) {
        const { error } = await signupRes.json();
        setError(error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // 2. Sign in the user
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Account created but sign in failed. Please try logging in.');
        setLoading(false);
        return;
      }

      // 3. Migrate localStorage data if exists
      if (hasLocalData) {
        const stored = localStorage.getItem('byu-survival-tool-data');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            await fetch('/api/migrate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            // Clear localStorage after successful migration
            localStorage.removeItem('byu-survival-tool-data');
          } catch (migrateError) {
            console.error('Migration failed:', migrateError);
            // Don't block signup if migration fails
          }
        }
      }

      // 4. Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[var(--text)] mb-3">
            BYU Survival Tool
          </h1>
          <p className="text-[var(--text-muted)]">Create your account</p>
        </div>

        <Card>
          {hasLocalData && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-5">
              <p className="text-sm text-blue-400">
                We detected existing data on this device. It will be automatically
                migrated to your new account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                At least 8 characters
              </p>
            </div>

            <div className="pt-2 pb-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
