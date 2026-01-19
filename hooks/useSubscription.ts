'use client';

import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/lib/store';

export interface ClientSubscriptionStatus {
  tier: 'trial' | 'free' | 'premium';
  isPremium: boolean;
  isTrialing: boolean;
  isLifetimePremium: boolean;
  trialDaysRemaining: number | null;
  trialEndsAt: string | null;
  plan: 'monthly' | 'yearly' | null;
  expiresAt: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'none' | 'lifetime';
  isLoading: boolean;
}

const defaultStatus: ClientSubscriptionStatus = {
  tier: 'free',
  isPremium: false,
  isTrialing: false,
  isLifetimePremium: false,
  trialDaysRemaining: null,
  trialEndsAt: null,
  plan: null,
  expiresAt: null,
  status: 'none',
  isLoading: true,
};

export function useSubscription(): ClientSubscriptionStatus & { refresh: () => Promise<void> } {
  const [status, setStatus] = useState<ClientSubscriptionStatus>(defaultStatus);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        setStatus({ ...data, isLoading: false });
      } else {
        setStatus({ ...defaultStatus, isLoading: false });
      }
    } catch {
      setStatus({ ...defaultStatus, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Sync premium status to store for color application logic
  const setIsPremium = useAppStore((state) => state.setIsPremium);
  useEffect(() => {
    if (!status.isLoading) {
      setIsPremium(status.isPremium);
    }
  }, [status.isPremium, status.isLoading, setIsPremium]);

  // Listen for subscription changes (e.g., after successful checkout)
  useEffect(() => {
    const handleSubscriptionChange = () => {
      fetchStatus();
    };

    window.addEventListener('subscription-changed', handleSubscriptionChange);
    return () => {
      window.removeEventListener('subscription-changed', handleSubscriptionChange);
    };
  }, [fetchStatus]);

  return { ...status, refresh: fetchStatus };
}

// Helper hook for checking specific feature access
export function useCanAccess(_feature: 'calendar' | 'shopping' | 'tools' | 'fileUpload' | 'recurring') {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) {
    return { canAccess: false, isLoading: true };
  }

  return { canAccess: isPremium, isLoading: false };
}

// Helper hook for checking limits
export function useFeatureLimit(feature: 'notes' | 'courses') {
  const { isPremium, isLoading } = useSubscription();
  const [limitInfo, setLimitInfo] = useState<{
    current: number;
    limit: number;
    isLoading: boolean;
  }>({ current: 0, limit: 0, isLoading: true });

  useEffect(() => {
    if (isLoading) return;

    // For premium users, no limits apply
    if (isPremium) {
      setLimitInfo({ current: 0, limit: Infinity, isLoading: false });
      return;
    }

    // Fetch current count from API
    const fetchLimit = async () => {
      try {
        const res = await fetch(`/api/subscription/limit?feature=${feature}`);
        if (res.ok) {
          const data = await res.json();
          setLimitInfo({ ...data, isLoading: false });
        }
      } catch {
        setLimitInfo({ current: 0, limit: 20, isLoading: false });
      }
    };

    fetchLimit();
  }, [feature, isPremium, isLoading]);

  return limitInfo;
}
