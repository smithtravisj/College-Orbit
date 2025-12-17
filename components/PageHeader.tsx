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
      <div className="mx-auto max-w-[var(--container)] px-8 py-7 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)] truncate">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--muted)] mt-2">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
