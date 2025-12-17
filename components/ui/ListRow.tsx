import React from 'react';

interface ListRowProps {
  title: string;
  subtitle?: string;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const ListRow = React.forwardRef<HTMLDivElement, ListRowProps>(
  ({ title, subtitle, metadata, actions, onClick, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`flex items-center justify-between h-[var(--list-row-height)] px-5 py-3 border-b border-[var(--border)] hover:bg-[var(--panel-2)] transition-colors cursor-pointer group ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--text)] truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-[var(--text-muted)] mt-1 truncate">{subtitle}</div>
          )}
        </div>

        {metadata && (
          <div className="flex-shrink-0 ml-4 text-xs text-[var(--text-muted)] text-right">
            {metadata}
          </div>
        )}

        {actions && (
          <div className="flex-shrink-0 ml-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

ListRow.displayName = 'ListRow';

export default ListRow;
