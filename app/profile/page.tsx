'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/useMediaQuery';

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { settings } = useAppStore();
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate passwords match if provided
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData: any = { name, email };
      if (password) {
        updateData.password = password;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error || 'Failed to update profile');
        setLoading(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setLoading(false);

      // Refresh the session to update user data
      await updateSession();

      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Profile Header */}
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Subtle glow behind title */}
            <div style={{ position: 'absolute', inset: '-20px -30px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(ellipse 100% 100% at 50% 50%, ${colorPalette.accent}18 0%, transparent 70%)`,
                }}
              />
            </div>
            <h1
              style={{
                position: 'relative',
                zIndex: 1,
                fontSize: isMobile ? '26px' : '34px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Profile
            </h1>
          </div>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Manage your account information.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[768px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="w-full grid grid-cols-1 gap-[var(--grid-gap)]">
          <Card title="Account Information">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm text-green-500">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Full Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h3 className="text-base font-semibold text-[var(--text)]" style={{ marginBottom: '16px' }}>
                  Change Password
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      minLength={8}
                    />
                    <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: '6px' }}>
                      At least 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '8px' }}>
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      minLength={8}
                    />
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: '12px', paddingBottom: '12px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full"
                  style={{
                    backgroundColor: 'var(--button-secondary)',
                    color: settings.theme === 'light' ? '#000000' : 'white',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border)'
                  }}
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
