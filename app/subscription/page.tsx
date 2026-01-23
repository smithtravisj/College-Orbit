'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, CreditCard, Calendar, AlertTriangle, Loader2, Check, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Link from 'next/link';

export default function SubscriptionPage() {
  const subscription = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChangePlanConfirm, setShowChangePlanConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isMobile = useIsMobile();
  const settings = useAppStore((state) => state.settings);
  const colorPalette = getCollegeColorPalette(settings.university || null, settings.theme || 'dark');

  const handleChangePlan = async () => {
    const newPlan = subscription.plan === 'monthly' ? 'yearly' : 'monthly';
    setLoading('change');
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to change plan' });
        setLoading(null);
        return;
      }

      setMessage({ type: 'success', text: data.message || `Plan change scheduled!` });
      setShowChangePlanConfirm(false);
      // Refresh subscription status after a delay to show the message
      setTimeout(() => window.location.reload(), 2500);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading('cancel');
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
        setLoading(null);
        return;
      }

      setMessage({ type: 'success', text: 'Your subscription has been canceled. You\'ll retain access until the end of your billing period.' });
      setShowCancelConfirm(false);
      // Refresh subscription status
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  const handleReactivate = async () => {
    setLoading('reactivate');
    setMessage(null);

    try {
      const res = await fetch('/api/stripe/reactivate', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to reactivate subscription' });
        setLoading(null);
        return;
      }

      setMessage({ type: 'success', text: 'Your subscription has been reactivated!' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('billing');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (subscription.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  // Redirect to pricing if not premium
  if (!subscription.isPremium) {
    return (
      <>
        <div className="mx-auto w-full max-w-[800px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Subscription
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            You don&apos;t have an active subscription.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[800px]" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <Crown size={48} style={{ color: colorPalette.accent, margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                Take Control of Your College Life
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '360px', margin: '0 auto 16px' }}>
                See your semester at a glance, never miss a deadline, and keep everything organized in one place.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Starting at <span style={{ fontWeight: 600, color: 'var(--text)' }}>$5/month</span> or <span style={{ fontWeight: 600, color: 'var(--text)' }}>$18/semester</span>
              </p>
              <Link href="/pricing">
                <Button variant="primary" size="lg">
                  <Crown size={18} />
                  View Plans
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const isCanceled = subscription.status === 'canceled';
  const isSemester = subscription.plan === 'semester';
  const otherPlan = subscription.plan === 'monthly' ? 'yearly' : 'monthly';
  const otherPlanPrice = otherPlan === 'yearly' ? '$48/year' : '$5/month';
  const currentPlanPrice = subscription.plan === 'yearly' ? '$48/year' : subscription.plan === 'semester' ? '$18 (4 months)' : '$5/month';

  return (
    <>
      {/* Page Header */}
      <div className="mx-auto w-full max-w-[800px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: '0px', textDecoration: 'none' }}>
          <ArrowLeft size={14} />
          Back to Account
        </Link>
        <div style={{ marginTop: '-12px' }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Manage Subscription
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            View and manage your Premium subscription.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[800px]" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>
        {/* Status Message */}
        {message && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}
          >
            <p style={{ fontSize: '14px', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)' }}>
              {message.text}
            </p>
          </div>
        )}

        {/* Canceled Notice */}
        {isCanceled && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>
                Subscription Canceled
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Your subscription has been canceled but you&apos;ll retain Premium access until {formatDate(subscription.expiresAt)}.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Current Plan Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Crown size={20} style={{ color: '#fff' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Current Plan</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                  Premium {subscription.plan === 'yearly' ? 'Yearly' : subscription.plan === 'semester' ? 'Semester' : 'Monthly'}
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{currentPlanPrice}</p>
              </div>
              <div
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isCanceled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  color: isCanceled ? 'var(--danger)' : 'var(--success)',
                }}
              >
                {isCanceled ? 'Canceled' : 'Active'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {isCanceled || isSemester ? 'Access ends' : 'Next billing date'}: {formatDate(subscription.expiresAt)}
                </span>
              </div>
              {isSemester && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Semester pass - one-time purchase, no auto-renewal
                </p>
              )}
            </div>
          </Card>

          {/* Change Plan Card - For monthly/yearly users */}
          {!isCanceled && !isSemester && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <CreditCard size={20} style={{ color: 'var(--text)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Change Plan</h2>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {subscription.plan === 'monthly'
                  ? 'Switch to yearly and save 20%! The change will take effect at your next billing date.'
                  : 'Switch to monthly for more flexibility. The change will take effect at the end of your current yearly period.'}
              </p>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--panel-2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                    Premium {otherPlan === 'yearly' ? 'Yearly' : 'Monthly'}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    {otherPlanPrice}
                    {otherPlan === 'yearly' && <span style={{ color: 'var(--success)', marginLeft: '8px' }}>(Save 20%)</span>}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setShowChangePlanConfirm(true)}
                  loading={loading === 'change'}
                  disabled={loading !== null}
                  style={{
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                  }}
                >
                  Switch Plan
                </Button>
              </div>
            </Card>
          )}

          {/* Upgrade Card - For semester users */}
          {!isCanceled && isSemester && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Crown size={20} style={{ color: 'var(--text)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Continue with Premium</h2>
              </div>

              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Your semester pass expires on {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}.
                Subscribe to keep your premium access!
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/checkout?plan=yearly" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--panel-2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                        Premium Yearly
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        $48/year <span style={{ color: 'var(--success)', marginLeft: '8px' }}>(Save 20%)</span>
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Subscribe
                    </Button>
                  </div>
                </Link>
                <Link href="/checkout?plan=monthly" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      background: 'var(--panel-2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                        Premium Monthly
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        $5/month
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Subscribe
                    </Button>
                  </div>
                </Link>
              </div>
            </Card>
          )}

          {/* Billing Card */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CreditCard size={20} style={{ color: 'var(--text)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>Payment Method</h2>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Update your payment method or view billing history through Stripe.
            </p>

            <Button
              variant="secondary"
              onClick={handleManageBilling}
              loading={loading === 'billing'}
              disabled={loading !== null}
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
              }}
            >
              Manage Billing
            </Button>
          </Card>

          {/* Cancel/Reactivate Card - Not shown for semester users (no recurring billing) */}
          {!isSemester && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
                  {isCanceled ? 'Reactivate Subscription' : 'Cancel Subscription'}
                </h2>
              </div>

              {isCanceled ? (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Changed your mind? Reactivate your subscription to continue enjoying Premium features.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleReactivate}
                    loading={loading === 'reactivate'}
                    disabled={loading !== null}
                  >
                    <Crown size={18} style={{ color: '#fff' }} />
                    Reactivate Subscription
                  </Button>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    If you cancel, you&apos;ll retain access to Premium features until the end of your current billing period. Your data will be preserved.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading !== null}
                    style={{
                      backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                      color: 'white',
                      borderColor: 'var(--border)',
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)',
                    }}
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Change Plan Confirmation Modal */}
      {showChangePlanConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3 style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
              Switch to {otherPlan === 'yearly' ? 'Yearly' : 'Monthly'}?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              {otherPlan === 'yearly'
                ? `Your plan will change to yearly ($48/year) at the end of your current billing period (${formatDate(subscription.expiresAt)}). You won't be charged until then.`
                : `Your plan will change to monthly ($5/month) at the end of your current billing period (${formatDate(subscription.expiresAt)}). You won't be charged until then.`}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowChangePlanConfirm(false)} disabled={loading !== null} style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)' }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleChangePlan} loading={loading === 'change'} disabled={loading !== null}>
                <Check size={18} style={{ color: '#fff' }} />
                Schedule Change
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3 style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
              Cancel Subscription?
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              You&apos;ll retain access to Premium features until {formatDate(subscription.expiresAt)}. After that, you&apos;ll be downgraded to the Free plan. Your data will be preserved.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowCancelConfirm(false)} disabled={loading !== null} style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)' }}>
                Keep Subscription
              </Button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading !== null}
                style={{
                  padding: '10px 16px',
                  backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                  color: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.2)',
                }}
              >
                {loading === 'cancel' ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
