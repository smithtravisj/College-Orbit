'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      const callbackUrl = searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      setError('Something went wrong. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            College Survival Tool
          </h1>
          <p style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px' }}>Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '14px', color: 'rgb(239, 68, 68)' }}>{error}</p>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text)' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: '13px',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    filter: 'brightness(1.6)'
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text)' }}>
              Don't have an account?{' '}
              <Link
                href="/signup"
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
    </div>
  );
}
