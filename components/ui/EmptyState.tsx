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

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div className={`rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-white/2 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="text-xl text-[var(--muted)]">{icon}</div>}
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">{description}</p>
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
