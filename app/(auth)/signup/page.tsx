'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getCollegeColorPalette } from '@/lib/collegeColors';

const UNIVERSITIES = [
  'Arizona State University',
  'Brigham Young University',
  'Brigham Young University Hawaii',
  'Brigham Young University Idaho',
  'Ohio State University',
  'UNC Chapel Hill',
  'University of Central Florida',
  'University of Texas at Austin',
  'Utah State University',
  'Utah Valley University',
];

const COLLEGE_ABBREVIATIONS: Record<string, string> = {
  'Brigham Young University': 'BYU',
  'Brigham Young University Idaho': 'BYUI',
  'Brigham Young University Hawaii': 'BYUH',
  'UNC Chapel Hill': 'UNC',
  'Utah State University': 'USU',
  'Utah Valley University': 'UVU',
  'Arizona State University': 'ASU',
  'University of Central Florida': 'UCF',
  'Ohio State University': 'OSU',
  'University of Texas at Austin': 'UT Austin',
};

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [collegeRequestName, setCollegeRequestName] = useState('');
  const [collegeButtonColor, setCollegeButtonColor] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    setUniversity(selectedUni);

    if (selectedUni) {
      // Use light mode accent colors for better visibility in dark mode (like links elsewhere)
      const palette = getCollegeColorPalette(selectedUni, 'light');
      setCollegeButtonColor(palette.accent);
    } else {
      setCollegeButtonColor('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signupRes = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, university }),
      });

      if (!signupRes.ok) {
        const { error } = await signupRes.json();
        setError(error || 'We couldn\'t create your account. Please try again.');
        setLoading(false);
        return;
      }

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

      if (collegeRequestName.trim()) {
        try {
          await fetch('/api/college-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collegeName: collegeRequestName }),
          });
        } catch (collegeError) {
          console.error('College request error:', collegeError);
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('byu-survival-tool-data');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError('Something went wrong. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const accentColor = collegeButtonColor || '#8b5cf6';

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
        background: `radial-gradient(circle, ${collegeButtonColor ? collegeButtonColor + '20' : 'rgba(99, 102, 241, 0.25)'} 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite',
        transition: 'background 0.3s',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        right: '-60px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${collegeButtonColor ? collegeButtonColor + '18' : 'rgba(168, 85, 247, 0.22)'} 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite reverse',
        transition: 'background 0.3s',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '-100px',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${collegeButtonColor ? collegeButtonColor + '15' : 'rgba(59, 130, 246, 0.2)'} 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'float 7s ease-in-out infinite',
        transition: 'background 0.3s',
        zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        animation: 'fadeInUp 0.6s ease-out',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Orbit Icon */}
        <div style={{ marginBottom: '10px', filter: collegeButtonColor ? 'brightness(0.85)' : 'none', transition: 'filter 0.3s' }}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 64 64"
            fill="none"
            style={{ margin: '0 auto' }}
          >
            <circle cx="32" cy="32" r="12" fill={`url(#planetGradient-${collegeButtonColor ? 'custom' : 'default'})`} />
            <ellipse
              cx="32"
              cy="32"
              rx="28"
              ry="10"
              stroke={`url(#orbitGradient-${collegeButtonColor ? 'custom' : 'default'})`}
              strokeWidth="2"
              fill="none"
              style={{ transform: 'rotate(-20deg)', transformOrigin: 'center' }}
            />
            <circle cx="54" cy="28" r="4" fill={`url(#moonGradient-${collegeButtonColor ? 'custom' : 'default'})`} />
            <defs>
              <linearGradient id="planetGradient-default" x1="20" y1="20" x2="44" y2="44">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="orbitGradient-default" x1="4" y1="32" x2="60" y2="32">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="moonGradient-default" x1="50" y1="24" x2="58" y2="32">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
              {collegeButtonColor && (
                <>
                  <linearGradient id="planetGradient-custom" x1="20" y1="20" x2="44" y2="44">
                    <stop offset="0%" stopColor={collegeButtonColor} />
                    <stop offset="100%" stopColor={collegeButtonColor} />
                  </linearGradient>
                  <linearGradient id="orbitGradient-custom" x1="4" y1="32" x2="60" y2="32">
                    <stop offset="0%" stopColor={collegeButtonColor} stopOpacity="0.3" />
                    <stop offset="50%" stopColor={collegeButtonColor} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={collegeButtonColor} stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="moonGradient-custom" x1="50" y1="24" x2="58" y2="32">
                    <stop offset="0%" stopColor={collegeButtonColor} />
                    <stop offset="100%" stopColor={collegeButtonColor} stopOpacity="0.6" />
                  </linearGradient>
                </>
              )}
            </defs>
          </svg>
        </div>

        <h1 style={{
          fontSize: '38px',
          fontWeight: 700,
          color: collegeButtonColor || 'var(--text)',
          marginBottom: '6px',
          letterSpacing: '-0.02em',
          transition: 'color 0.3s, filter 0.3s',
          textShadow: collegeButtonColor ? `0 0 40px ${collegeButtonColor}40` : 'none',
          filter: collegeButtonColor ? 'brightness(0.85)' : 'none',
        }}>
          {university ? `${COLLEGE_ABBREVIATIONS[university]} Orbit` : 'College Orbit'}
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '14px',
          letterSpacing: '0.01em',
        }}>
          Stay organized. Stay on track.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--panel)',
        border: `1px solid ${collegeButtonColor ? collegeButtonColor + '30' : 'var(--border)'}`,
        borderRadius: '20px',
        padding: '22px',
        boxShadow: `0 4px 24px rgba(0, 0, 0, 0.12), 0 0 48px ${collegeButtonColor ? collegeButtonColor + '20' : 'rgba(99, 102, 241, 0.08)'}`,
        animation: 'fadeInUp 0.6s ease-out 0.1s backwards',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{
          color: collegeButtonColor || 'var(--text)',
          marginBottom: '16px',
          fontSize: '16px',
          fontWeight: 500,
          textAlign: 'center',
          transition: 'color 0.3s',
        }}>
          Create your account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              borderRadius: '12px',
              padding: '10px 14px',
            }}>
              <p style={{ fontSize: '13px', color: 'rgb(239, 68, 68)' }}>{error}</p>
            </div>
          )}

          {/* Name and Email row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
          </div>

          {/* Password and University row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
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
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                At least 8 characters
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                University
              </label>
              <select
                value={university}
                onChange={handleUniversityChange}
                style={{
                  width: '100%',
                  padding: '12px 30px 12px 12px',
                  backgroundColor: 'var(--panel-2)',
                  border: `1px solid ${collegeButtonColor ? collegeButtonColor + '50' : 'var(--border)'}`,
                  color: university ? 'var(--text)' : 'var(--text-muted)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s',
                }}
              >
                <option value="">Select University</option>
                {UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '38px',
                pointerEvents: 'none',
              }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)">
                  <path d="M4 6l4 4 4-4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* College request (only if no university selected) */}
          {!university && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                Don't see your university?
              </label>
              <input
                type="text"
                value={collegeRequestName}
                onChange={(e) => setCollegeRequestName(e.target.value)}
                placeholder="Request your university to be added"
                maxLength={100}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  boxSizing: 'border-box',
                }}
                disabled={loading}
              />
            </div>
          )}

          {/* Terms checkbox */}
          <div style={{ paddingTop: '4px' }}>
            <div
              onClick={() => setTermsAccepted(!termsAccepted)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `2px solid ${termsAccepted ? accentColor : 'var(--border)'}`,
                  backgroundColor: termsAccepted ? accentColor : 'var(--panel-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  marginTop: '1px',
                  flexShrink: 0,
                }}
              >
                {termsAccepted && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: accentColor,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: accentColor,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Privacy Policy
                </Link>
              </span>
            </div>
          </div>

          {/* Submit button */}
          <div style={{ paddingTop: '8px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{
                width: '100%',
                background: collegeButtonColor
                  ? `linear-gradient(155deg, rgba(255,255,255,0.45) 0%, rgba(0,0,0,0.35) 100%), ${collegeButtonColor}`
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: collegeButtonColor
                  ? `0 4px 14px ${collegeButtonColor}60, inset 0 0 0 100px rgba(0,0,0,0.15)`
                  : '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: accentColor,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '18px',
        animation: 'fadeInUp 0.6s ease-out 0.2s backwards',
        position: 'relative',
        zIndex: 1,
      }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Questions?{' '}
          <a
            href="mailto:collegeorbit@protonmail.com"
            style={{
              color: accentColor,
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
