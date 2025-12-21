'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { getCollegeColorPalette } from '@/lib/collegeColors';

const UNIVERSITIES = [
  'Brigham Young University',
  'Brigham Young University Idaho',
  'Brigham Young University Hawaii',
  'UNC Chapel Hill',
  'Utah State University',
  'Utah Valley University',
  'Arizona State University',
];

// College name abbreviations for display
const COLLEGE_ABBREVIATIONS: Record<string, string> = {
  'Brigham Young University': 'BYU',
  'Brigham Young University Idaho': 'BYUI',
  'Brigham Young University Hawaii': 'BYUH',
  'UNC Chapel Hill': 'UNC',
  'Utah State University': 'USU',
  'Utah Valley University': 'UVU',
  'Arizona State University': 'ASU',
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

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUni = e.target.value;
    setUniversity(selectedUni);

    // Get the college-specific dark mode accent color
    if (selectedUni) {
      const palette = getCollegeColorPalette(selectedUni, 'dark');
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
      // 1. Create user account
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

      // 3. If there's a college request, submit it after authentication
      if (collegeRequestName.trim()) {
        try {
          const collegeRes = await fetch('/api/college-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collegeName: collegeRequestName }),
          });

          if (!collegeRes.ok) {
            console.error('College request failed but continuing with signup');
          }
        } catch (collegeError) {
          console.error('College request error:', collegeError);
          // Don't block signup if college request fails
        }
      }

      // Clear any existing local data for a fresh start
      if (typeof window !== 'undefined') {
        localStorage.removeItem('byu-survival-tool-data');
      }

      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error) {
      setError('Something went wrong. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
          {university ? `${COLLEGE_ABBREVIATIONS[university]} Survival Tool` : 'College Survival Tool'}
        </h1>
        <p style={{ color: 'var(--text)', marginBottom: '6px', fontSize: '15px' }}>Create your account</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', padding: '10px' }}>
              <p style={{ fontSize: '13px', color: 'rgb(239, 68, 68)' }}>{error}</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
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
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              At least 8 characters
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
              University
            </label>
            <select
              value={university}
              onChange={handleUniversityChange}
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
              <option value="">Select University</option>
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

          {!university && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                Don't see your university?
              </label>
              <input
                type="text"
                value={collegeRequestName}
                onChange={(e) => setCollegeRequestName(e.target.value)}
                placeholder="Request university"
                maxLength={100}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '12px 12px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  backgroundColor: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
                disabled={loading}
              />
            </div>
          )}

          {/* Privacy Policy & Terms Consent */}
          <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: collegeButtonColor || 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    filter: collegeButtonColor ? 'brightness(1.8) saturate(1.1)' : 'brightness(1.3)',
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
                    color: collegeButtonColor || 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    filter: collegeButtonColor ? 'brightness(1.8) saturate(1.1)' : 'brightness(1.3)',
                  }}
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <div style={{ paddingTop: '4px', paddingBottom: '4px' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{
                width: '100%',
                ...(collegeButtonColor && { backgroundColor: collegeButtonColor }),
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              style={{
                color: collegeButtonColor || 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 600,
                filter: collegeButtonColor ? 'brightness(1.8) saturate(1.1)' : 'brightness(1.3)',
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
