'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const UNIVERSITIES = [
  'Brigham Young University',
  'Brigham Young University Idaho',
  'Brigham Young University Hawaii',
  'UNC Chapel Hill',
  'Utah State University',
  'Utah Valley University',
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
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
        body: JSON.stringify({ name, email, password, university }),
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
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
          College Survival Tool
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '18px' }}>Create your account</p>
      </div>

      <Card>
        {hasLocalData && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: 'rgb(96, 165, 250)' }}>
              We detected existing data on this device. It will be automatically
              migrated to your new account.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '14px', color: 'rgb(239, 68, 68)' }}>{error}</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              At least 8 characters
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
              University
            </label>
            <select
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 30px 12px 12px',
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--border)',
                color: university ? 'var(--text)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontFamily: 'inherit',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value="" disabled>
                Select University
              </option>
              {UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: '18px',
                top: '52px',
                pointerEvents: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)">
                <path d="M4 6l4 4 4-4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
