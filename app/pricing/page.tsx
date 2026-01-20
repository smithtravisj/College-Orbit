'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { Check, Crown, Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { FREE_TIER_LIMITS } from '@/lib/subscription';
import Link from 'next/link';

const FREE_FEATURES = [
  'Dashboard with key insights',
  'Tasks & Assignments tracking',
  'Exam scheduling with reminders',
  `Up to ${FREE_TIER_LIMITS.maxNotes} notes`,
  `Up to ${FREE_TIER_LIMITS.maxCourses} courses`,
  'Quick Links tool',
  'Settings & Account management',
];

const PREMIUM_FEATURES = [
  'Everything in Free, plus:',
  'Full Calendar view',
  'Shopping lists & Pantry tracking',
  'Unlimited notes',
  'Unlimited courses',
  'File attachments',
  'Recurring tasks, assignments & exams',
  'All Tools (GPA Calculator, Pomodoro, etc.)',
  'Custom color themes',
  'Visual effects customization',
  'Page & Card visibility customization',
  'Smart form filling',
];

// Public pricing page for unauthenticated users
function PublicPricingPage() {
  const router = useRouter();
  const [premiumHover, setPremiumHover] = useState(false);
  const isMobile = useIsMobile();
  // Orbit purple branding colors (no college selected)
  const accentColor = '#7c3aed';
  const linkColor = '#8b5cf6';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Page Header */}
      <div className="w-full max-w-[1200px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ marginTop: '-8px' }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Pricing
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Start with a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-[1200px]" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px', marginBottom: '32px' }}>
          {/* Free Plan */}
          <Card noAccent>
            <div style={{ padding: isMobile ? '4px' : '8px' }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Free
              </h2>
              <p style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                $0
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}> /forever</span>
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Perfect for getting started
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Premium Plan */}
          <div
            onMouseEnter={() => setPremiumHover(true)}
            onMouseLeave={() => setPremiumHover(false)}
            style={{
              background: 'var(--panel)',
              borderRadius: '16px',
              border: `2px solid ${accentColor}`,
              padding: isMobile ? '20px' : '24px',
              position: 'relative',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              transform: premiumHover ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: premiumHover ? '0 8px 24px rgba(0, 0, 0, 0.15)' : 'none',
            }}
          >
            {/* Recommended Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '20px',
                background: accentColor,
                color: '#fff',
                letterSpacing: '0.5px',
              }}
            >
              RECOMMENDED
            </div>

            <div style={{ padding: isMobile ? '4px' : '8px' }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={20} style={{ color: '#fff' }} />
                Premium
              </h2>

              <p style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                $5
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}> /month</span>
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                or <span style={{ fontWeight: 600, color: 'var(--text)' }}>$48/year</span>{' '}
                <span style={{ color: 'var(--success)' }}>(save 20%)</span>
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                {PREMIUM_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      color: feature.startsWith('Everything') ? 'var(--text)' : 'var(--text-muted)',
                      fontWeight: feature.startsWith('Everything') ? 500 : 400,
                      marginBottom: '10px',
                    }}
                  >
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <Button
                  variant="primary"
                  className="w-full"
                  style={{
                    background: `linear-gradient(135deg, #8b5cf6 0%, ${accentColor} 50%, #6d28d9 100%)`,
                    boxShadow: `0 0 20px ${accentColor}60, 0 4px 12px rgba(0,0,0,0.3)`,
                  }}
                >
                  <Crown size={18} />
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Questions? Contact us at{' '}
            <a href="mailto:collegeorbit@protonmail.com" style={{ color: linkColor, textDecoration: 'none' }}>
              collegeorbit@protonmail.com
            </a>
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            14-day free trial included. Cancel anytime. Your data is always preserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Authenticated pricing page (original)
function AuthenticatedPricingPage() {
  const router = useRouter();
  const { isPremium, isTrialing, tier, isLoading: subLoading } = useSubscription();
  const [premiumHover, setPremiumHover] = useState(false);
  const isMobile = useIsMobile();
  const settings = useAppStore((state) => state.settings);
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');
  const mutedText = settings.theme === 'light' ? 'var(--text-muted)' : '#9ca3af';

  if (subLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: mutedText }} />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mx-auto w-full max-w-[1200px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ marginTop: '-8px' }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Pricing
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            {isTrialing
              ? 'Subscribe before your trial ends to keep all premium features.'
              : isPremium
              ? 'Manage your subscription below.'
              : 'Choose a plan to unlock all features.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1200px]" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '24px', marginBottom: '32px' }}>
          {/* Free Plan */}
          <Card>
            <div style={{ padding: isMobile ? '4px' : '8px' }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                Free
              </h2>
              <p style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                $0
                <span style={{ fontSize: '14px', fontWeight: 400, color: mutedText }}> /forever</span>
              </p>
              <p style={{ fontSize: '13px', color: mutedText, marginBottom: '20px' }}>
                Perfect for getting started
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: mutedText, marginBottom: '10px' }}>
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              {tier === 'free' && !isTrialing && (
                <Button variant="secondary" disabled className="w-full">
                  Current Plan
                </Button>
              )}
            </div>
          </Card>

          {/* Premium Plan */}
          <div
            onMouseEnter={() => setPremiumHover(true)}
            onMouseLeave={() => setPremiumHover(false)}
            style={{
              background: 'var(--panel)',
              borderRadius: '16px',
              border: `2px solid ${colorPalette.accent}`,
              padding: isMobile ? '20px' : '24px',
              position: 'relative',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              transform: premiumHover ? 'translateY(-4px)' : 'translateY(0)',
              boxShadow: premiumHover ? '0 8px 24px rgba(0, 0, 0, 0.15)' : 'none',
            }}
          >
            {/* Recommended Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '20px',
                background: colorPalette.accent,
                color: settings.theme === 'light' ? '#000' : '#fff',
                letterSpacing: '0.5px',
              }}
            >
              RECOMMENDED
            </div>

            <div style={{ padding: isMobile ? '4px' : '8px' }}>
              <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={20} style={{ color: '#fff' }} />
                Premium
              </h2>

              <p style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                $5
                <span style={{ fontSize: '14px', fontWeight: 400, color: mutedText }}> /month</span>
              </p>
              <p style={{ fontSize: '13px', color: mutedText, marginBottom: '20px' }}>
                or <span style={{ fontWeight: 600, color: 'var(--text)' }}>$48/year</span>{' '}
                <span style={{ color: 'var(--success)' }}>(save 20%)</span>
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                {PREMIUM_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '13px',
                      color: feature.startsWith('Everything') ? 'var(--text)' : mutedText,
                      fontWeight: feature.startsWith('Everything') ? 500 : 400,
                      marginBottom: '10px',
                    }}
                  >
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                    {feature}
                  </li>
                ))}
              </ul>

              {isPremium && !isTrialing ? (
                <Link href="/subscription">
                  <Button
                    variant="secondary"
                    className="w-full"
                  >
                    Manage Subscription
                  </Button>
                </Link>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link href="/checkout?plan=yearly">
                    <Button
                      variant="primary"
                      className="w-full"
                    >
                      <Crown size={18} />
                      Get Yearly - $48/yr
                    </Button>
                  </Link>
                  <Link href="/checkout?plan=semester">
                    <Button
                      variant="secondary"
                      className="w-full"
                    >
                      Get Semester - $18 (4 months)
                    </Button>
                  </Link>
                  <Link href="/checkout?plan=monthly">
                    <Button
                      variant="secondary"
                      className="w-full"
                    >
                      Get Monthly - $5/mo
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Questions? Contact us at{' '}
            <a href="mailto:collegeorbit@protonmail.com" style={{ color: colorPalette.link, textDecoration: 'none' }}>
              collegeorbit@protonmail.com
            </a>
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Cancel anytime. Your data is always preserved.
          </p>
        </div>
      </div>
    </>
  );
}

export default function PricingPage() {
  const { status } = useSession();

  // Show public pricing page for unauthenticated users
  if (status === 'unauthenticated') {
    return <PublicPricingPage />;
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#9ca3af' }} />
      </div>
    );
  }

  // Show authenticated pricing page
  return <AuthenticatedPricingPage />;
}
