'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
          College Survival Tool
        </h1>
        <p style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px' }}>Reset your password</p>
      </div>

      <Card>
        {submitted ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
                We've sent a password reset link to <strong>{email}</strong>. The link will expire in 1 hour.
              </p>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <Link
                href="/login"
                style={{ display: 'block', textAlign: 'center', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}
              >
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
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

            <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text)' }}>
            Remember your password?{' '}
            <Link
              href="/login"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
