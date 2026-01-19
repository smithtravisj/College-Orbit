'use client';

import { Crown } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface UpgradePromptProps {
  feature: string;
  compact?: boolean;
}

export default function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
  if (compact) {
    return (
      <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline">
        <Crown size={12} />
        Upgrade for {feature}
      </Link>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-4 p-4 rounded-lg"
      style={{
        background: 'linear-gradient(135deg, var(--accent)08 0%, var(--accent)04 100%)',
        border: '1px solid var(--accent)20',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: 'var(--accent)15' }}
        >
          <Crown size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">
            {feature} requires Premium
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Upgrade to unlock this feature
          </p>
        </div>
      </div>
      <Link href="/pricing">
        <Button variant="primary" size="sm">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
