'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-[var(--panel)]/95 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="w-full mx-auto flex items-center justify-between" style={{ padding: '12px 16px', gap: '8px' }}>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[var(--text)] truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-[var(--muted)]" style={{ marginTop: '4px' }}>{subtitle}</p>}
          {!subtitle && <p className="text-xs text-[var(--text-muted)] md:hidden" style={{ marginTop: '2px' }}>BYU Survival Tool</p>}
        </div>
        {actions && <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 text-sm">{actions}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
