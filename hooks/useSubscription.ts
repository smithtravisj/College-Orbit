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
  plan: 'monthly' | 'yearly' | 'semester' | null;
  expiresAt: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'none' | 'lifetime';
  isLoading: boolean;
}

// Read cached subscription status from localStorage for faster initial load
const getCachedSubscriptionStatus = (): ClientSubscriptionStatus | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem('app-subscriptionStatus');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('Failed to parse cached subscription status:', e);
  }
  return null;
};

// Save subscription status to localStorage
const cacheSubscriptionStatus = (status: ClientSubscriptionStatus): void => {
  if (typeof window === 'undefined') return;
  try {
    // Don't cache the isLoading state
    const toCache = { ...status, isLoading: false };
    localStorage.setItem('app-subscriptionStatus', JSON.stringify(toCache));
    // Also cache isPremium separately for other uses
    localStorage.setItem('app-isPremium', status.isPremium ? 'true' : 'false');
  } catch (e) {
    console.warn('Failed to cache subscription status:', e);
  }
};

const getDefaultStatus = (): ClientSubscriptionStatus => {
  // Try to use cached status first
  const cached = getCachedSubscriptionStatus();
  if (cached) {
    return { ...cached, isLoading: false }; // Use cached data, no loading state
  }

  // Fallback to default
  return {
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
};

export function useSubscription(): ClientSubscriptionStatus & { refresh: () => Promise<void> } {
  const [status, setStatus] = useState<ClientSubscriptionStatus>(getDefaultStatus);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        const newStatus = { ...data, isLoading: false };
        setStatus(newStatus);
        cacheSubscriptionStatus(newStatus);
      } else {
        setStatus({ ...getDefaultStatus(), isLoading: false });
      }
    } catch {
      setStatus({ ...getDefaultStatus(), isLoading: false });
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
