'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      // Don't clear cache on login - let the store handle userId mismatches
      // This allows returning users to get instant cached data loading
      // The store will detect if the logged-in user differs from cached user and clear appropriately

      // Use hard navigation to ensure session cookie is properly recognized
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      window.location.href = callbackUrl;
    } catch (error) {
      setError('Something went wrong. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
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

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
        animation: 'fadeInUp 0.6s ease-out',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Orbit Icon */}
        <div style={{ marginBottom: '12px' }}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={{ margin: '0 auto' }}
          >
            {/* Planet */}
            <circle cx="32" cy="32" r="12" fill="url(#planetGradient)" />
            {/* Orbit ring */}
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
            {/* Small moon */}
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

      {/* Card */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 48px rgba(99, 102, 241, 0.08)',
        animation: 'fadeInUp 0.6s ease-out 0.1s backwards',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{
          color: 'var(--text)',
          marginBottom: '18px',
          fontSize: '17px',
          fontWeight: 500,
          textAlign: 'center',
        }}>
          Sign in to your account
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: '13px',
                  color: '#a1a1aa',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword(!showPassword)}
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
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ paddingTop: '8px', display: 'flex', gap: '10px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: searchParams.get('callbackUrl') || '/' })}
              disabled={loading}
              style={{
                width: '48px',
                height: '48px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f46'; e.currentTarget.style.borderColor = '#52525b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.borderColor = '#3f3f46'; }}
              title="Sign in with Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => signIn('azure-ad', { callbackUrl: searchParams.get('callbackUrl') || '/' })}
              disabled={loading}
              style={{
                width: '48px',
                height: '48px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#3f3f46'; e.currentTarget.style.borderColor = '#52525b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#27272a'; e.currentTarget.style.borderColor = '#3f3f46'; }}
              title="Sign in with Microsoft"
            >
              <svg width="18" height="18" viewBox="0 0 21 21">
                <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
                <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
                <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
                <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
              </svg>
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link
              href="/signup"
              style={{
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
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

      {/* Keyframe animations */}
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
}
