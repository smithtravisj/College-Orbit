'use client';

import { useFeatureLimit, useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';

interface LimitIndicatorProps {
  feature: 'notes' | 'courses';
  showUpgradeLink?: boolean;
}

export default function LimitIndicator({ feature, showUpgradeLink = true }: LimitIndicatorProps) {
  const { isPremium } = useSubscription();
  const { current, limit, isLoading } = useFeatureLimit(feature);

  // Don't show for premium users or while loading
  if (isPremium || isLoading || limit === null) {
    return null;
  }

  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= limit;

  const label = feature === 'notes' ? 'notes' : 'courses';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={
          isAtLimit
            ? 'text-[var(--danger)]'
            : isNearLimit
            ? 'text-[var(--warning)]'
            : 'text-[var(--text-muted)]'
        }
      >
        {current}/{limit} {label}
      </span>
      {showUpgradeLink && isNearLimit && (
        <Link
          href="/pricing"
          className="text-[var(--accent)] hover:underline"
        >
          {isAtLimit ? 'Upgrade for unlimited' : 'Upgrade'}
        </Link>
      )}
    </div>
  );
}
