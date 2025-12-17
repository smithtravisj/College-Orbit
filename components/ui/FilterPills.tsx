import React from 'react';

export interface FilterPillsProps {
  filters: Array<{ value: string; label: string }>;
  activeFilter: string;
  onChange: (value: string) => void;
  className?: string;
}

const FilterPills = React.forwardRef<HTMLDivElement, FilterPillsProps>(
  ({ filters, activeFilter, onChange, className = '' }, ref) => {
    return (
      <div ref={ref} className={`flex gap-3 ${className}`}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-colors ${
              activeFilter === filter.value
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--panel-2)] text-[var(--text-secondary)] hover:bg-[var(--panel-3)] hover:text-[var(--text)]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    );
  }
);

FilterPills.displayName = 'FilterPills';

export default FilterPills;
