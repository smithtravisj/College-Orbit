'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate password format
  const passwordErrors: string[] = [];
  if (newPassword && newPassword.length < 8) {
    passwordErrors.push('At least 8 characters');
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    passwordErrors.push('Passwords must match');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('No reset token found');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            College Survival Tool
          </h1>
        </div>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Invalid Reset Link
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              The reset link is missing or invalid. Please request a new one.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link href="/forgot-password" style={{ display: 'block', textAlign: 'center', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}>
              Request New Reset Link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            College Survival Tool
          </h1>
        </div>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle size={48} color="var(--text-muted)" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Password Reset Successful!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Your password has been changed. Redirecting to login...
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link href="/login" style={{ display: 'block', textAlign: 'center', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}>
              Go to Login
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
          College Survival Tool
        </h1>
        <p style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px' }}>Create a new password</p>
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
              New Password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            {passwordErrors.length > 0 && newPassword && (
              <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgb(239, 68, 68)' }}>
                {passwordErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || passwordErrors.length > 0}
              style={{ width: '100%' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/login" style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, filter: 'brightness(1.6)' }}>
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
