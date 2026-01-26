'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Crown, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'trial-banner-dismissed';

export default function TrialBanner() {
  const { isTrialing, trialDaysRemaining, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(true); // Start dismissed to avoid flash

  useEffect(() => {
    // Check if banner was dismissed today
    const dismissedDate = localStorage.getItem(DISMISSED_KEY);
    const today = new Date().toDateString();
    setDismissed(dismissedDate === today);
  }, []);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem(DISMISSED_KEY, today);
    setDismissed(true);
  };

  if (isLoading || !isTrialing || dismissed || trialDaysRemaining === null) {
    return null;
  }

  const isUrgent = trialDaysRemaining <= 3;

  return (
    <div
      className="border-b"
      style={{
        background: isUrgent
          ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
          : 'linear-gradient(90deg, var(--accent)10 0%, var(--accent)05 100%)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Crown
            size={16}
            className={isUrgent ? 'text-red-500' : 'text-[var(--accent)]'}
          />
          <span className="text-[var(--text)]">
            <span className="font-medium">
              {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
            </span>
            {' '}left in your trial
          </span>
          <span className="hidden sm:inline text-[var(--text-muted)]">
            {isUrgent ? "Don't lose your calendar & tools!" : 'Keep your semester organized.'}
          </span>
          <Link
            href="/pricing"
            className="text-[var(--accent)] hover:underline font-medium"
          >
            Subscribe now
          </Link>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
