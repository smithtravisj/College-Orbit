import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`rounded-[var(--radius-card)] border border-dashed border-[var(--border)] ${className}`} style={{ padding: '20px', position: 'relative', zIndex: 10, backgroundColor: 'var(--panel)' }}>
      <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
        {icon && <div className="text-xl text-[var(--muted)]">{icon}</div>}
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--muted)]" style={{ marginBottom: '16px' }}>{description}</p>
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
