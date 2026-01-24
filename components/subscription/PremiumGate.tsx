'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Lock, Crown, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

export default function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <>
        {/* Page Header - matches other pages */}
        <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            {feature}
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            {feature === 'Calendar' ? 'Your schedule at a glance.' : feature === 'Shopping' ? 'Manage your shopping lists.' : 'Premium feature.'}
          </p>
        </div>

        {/* Locked Content */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: isMobile ? '40px 20px' : '60px 24px' }}>
          <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--panel-2) 0%, var(--panel) 100%)',
                border: '1px solid var(--border)',
              }}
            >
              <Lock size={36} className="text-[var(--text-muted)]" />
            </div>
          </div>

          <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
            {feature === 'Calendar'
              ? 'See Your Entire Semester at a Glance'
              : feature === 'Shopping'
              ? 'Never Run Out of Essentials Again'
              : `${feature} is a Premium Feature`}
          </h2>

          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            {feature === 'Calendar'
              ? 'Plan ahead, spot conflicts early, and stay on top of every deadline and exam — all in one view.'
              : feature === 'Shopping'
              ? 'Track groceries, manage your pantry, and keep a wishlist so you always know what you need.'
              : `Upgrade to Premium to access ${feature} and take control of your college life.`}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <Link href="/pricing">
              <Button variant="primary" size="lg" style={{ minWidth: '200px' }}>
                <Crown size={18} />
                View Plans
              </Button>
            </Link>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Starting at just <span style={{ fontWeight: 600, color: 'var(--text)' }}>$3/month</span> or <span style={{ fontWeight: 600, color: 'var(--text)' }}>$10/semester</span>
          </p>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Your data is safely stored and will be accessible once you subscribe.
          </p>

          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>With Premium, you can:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '10px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
              {[
                'See your entire semester at a glance',
                'Never forget a recurring assignment',
                'Keep everything for a class in one place',
                'Track groceries and never run out',
                'Calculate your GPA and plan ahead',
                'Make the app truly yours with themes',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
