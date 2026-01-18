'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    setHasAnimated(true);
  }, []);

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
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Shared wrapper with decorative elements
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ position: 'relative' }}>
      {/* Floating decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        left: '-80px',
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        right: '-60px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite reverse',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '-100px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'float 7s ease-in-out infinite',
        zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
        animation: 'fadeInUp 0.6s ease-out',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ marginBottom: '12px' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={{ margin: '0 auto' }}
          >
            <circle cx="32" cy="32" r="12" fill="url(#planetGradient)" />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke="url(#orbitGradient)"
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill="url(#moonGradient)" />
            <defs>
              <linearGradient id="planetGradient" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="orbitGradient" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="moonGradient" x1="50" y1="24" x2="58" y2="32">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={{
          fontSize: '42px',
          fontWeight: 700,
          color: 'var(--text)',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          College Orbit
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '15px',
          letterSpacing: '0.01em',
        }}>
          Stay organized. Stay on track.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        animation: 'fadeInUp 0.6s ease-out 0.2s backwards',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Questions?{' '}
          <a
            href="mailto:collegeorbit@protonmail.com"
            style={{
              color: '#8b5cf6',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
          >
            collegeorbit@protonmail.com
          </a>
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );

  if (!token) {
    return (
      <PageWrapper>
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 48px rgba(99, 102, 241, 0.08)',
          animation: 'fadeInUp 0.6s ease-out 0.1s backwards',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>❌</div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
              Invalid Reset Link
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              The reset link is missing or invalid. Please request a new one.
            </p>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <Link
              href="/forgot-password"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper>
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 48px rgba(99, 102, 241, 0.08)',
          animation: 'fadeInUp 0.6s ease-out 0.1s backwards',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <CheckCircle size={48} color="#8b5cf6" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>
              Password Reset Successful!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Your password has been changed. Redirecting to login...
            </p>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <Link
              href="/login"
              style={{
                display: 'block',
                textAlign: 'center',
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
            >
              Go to Login
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 0 48px rgba(99, 102, 241, 0.08)',
        animation: hasAnimated ? 'none' : 'fadeInUp 0.6s ease-out 0.1s backwards',
      }}>
        <p style={{
          color: 'var(--text)',
          marginBottom: '18px',
          fontSize: '17px',
          fontWeight: 500,
          textAlign: 'center',
        }}>
          Create a new password
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <p style={{ fontSize: '14px', color: 'rgb(239, 68, 68)' }}>{error}</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                name="new-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.length > 0 && newPassword && (
              <div style={{ marginTop: '6px', fontSize: '13px', color: 'rgb(239, 68, 68)' }}>
                {passwordErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '8px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
                name="confirm-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || passwordErrors.length > 0}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <Link
            href="/login"
            style={{
              fontSize: '14px',
              color: '#8b5cf6',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
