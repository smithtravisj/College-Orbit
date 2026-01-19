'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, Check, Shield, Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Link from 'next/link';

const FEATURES = [
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
];

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subscription = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const settings = useAppStore((state) => state.settings);
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

  // Get plan from URL if provided
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'monthly' || planParam === 'yearly') {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  // Redirect if already premium
  useEffect(() => {
    if (!subscription.isLoading && subscription.isPremium && !subscription.isTrialing) {
      router.push('/subscription');
    }
  }, [subscription, router]);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start checkout');
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (subscription.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mx-auto w-full max-w-[900px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: '0px', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          Back to Pricing
        </Link>
        <div style={{ marginTop: '-12px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
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
              Checkout
            </h1>
          </div>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            {subscription.isTrialing ? 'Subscribe before your trial ends.' : 'Upgrade to Premium today.'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[900px]" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          {/* Plan Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Select Your Plan
            </h2>

            {/* Yearly Option */}
            <div
              onClick={() => setSelectedPlan('yearly')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${selectedPlan === 'yearly' ? colorPalette.accent : 'var(--border)'}`,
                background: selectedPlan === 'yearly' ? `${colorPalette.accent}10` : 'var(--panel)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Best Value Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '16px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'var(--success)',
                  color: '#fff',
                }}
              >
                BEST VALUE
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Yearly</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    $40/year <span style={{ color: 'var(--success)' }}>(Save 33%)</span>
                  </p>
                </div>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === 'yearly' ? colorPalette.accent : 'var(--border)'}`,
                    background: selectedPlan === 'yearly' ? colorPalette.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedPlan === 'yearly' && <Check size={14} style={{ color: '#fff' }} />}
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                That&apos;s just $3.33/month
              </p>
            </div>

            {/* Monthly Option */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: `2px solid ${selectedPlan === 'monthly' ? colorPalette.accent : 'var(--border)'}`,
                background: selectedPlan === 'monthly' ? `${colorPalette.accent}10` : 'var(--panel)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Monthly</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>$5/month</p>
                </div>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${selectedPlan === 'monthly' ? colorPalette.accent : 'var(--border)'}`,
                    background: selectedPlan === 'monthly' ? colorPalette.accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedPlan === 'monthly' && <Check size={14} style={{ color: '#fff' }} />}
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Flexible monthly billing
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <p style={{ fontSize: '14px', color: 'var(--danger)' }}>{error}</p>
              </div>
            )}

            {/* Checkout Button - Desktop Only */}
            {!isMobile && (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckout}
                  loading={loading}
                  disabled={loading}
                  className="w-full"
                  style={{ marginTop: '8px' }}
                >
                  <Crown size={18} />
                  Continue to Payment
                </Button>

                {/* Security Note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Secure payment powered by Stripe
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Order Summary */}
          <Card>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
              Order Summary
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${colorPalette.accent} 0%, ${colorPalette.accent}80 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crown size={24} style={{ color: '#fff' }} />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                  Premium {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  {selectedPlan === 'yearly' ? '$40.00/year' : '$5.00/month'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '12px' }}>
                What you&apos;ll get:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {FEATURES.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      marginBottom: '8px',
                    }}
                  >
                    <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                  {selectedPlan === 'yearly' ? '$40.00' : '$5.00'}
                </span>
              </div>
              {selectedPlan === 'yearly' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--success)' }}>You save</span>
                  <span style={{ fontSize: '14px', color: 'var(--success)' }}>$20.00</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Total due today</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                  {selectedPlan === 'yearly' ? '$40.00' : '$5.00'}
                </span>
              </div>
            </div>
          </Card>

          {/* Checkout Button - Mobile Only */}
          {isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                loading={loading}
                disabled={loading}
                className="w-full"
              >
                <Crown size={18} />
                Continue to Payment
              </Button>

              {/* Security Note */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Cancel anytime. Your data is always preserved.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@collegeorbit.app" style={{ color: colorPalette.link, textDecoration: 'none' }}>
              support@collegeorbit.app
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
