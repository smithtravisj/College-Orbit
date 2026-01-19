'use client';

import { X, FolderOpen, Tag, Gauge, Calendar, Clock, Link, CheckCircle, Trash2, MapPin, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Button from '@/components/ui/Button';

export type EntityType = 'task' | 'deadline' | 'exam' | 'course';

export type BulkAction =
  | 'course'
  | 'tags'
  | 'priority'
  | 'date'
  | 'time'
  | 'link'
  | 'complete'
  | 'delete'
  | 'location'
  | 'term';

interface BulkEditToolbarProps {
  selectedCount: number;
  entityType: EntityType;
  onAction: (action: BulkAction) => void;
  onCancel: () => void;
  onSelectAll?: () => void;
}

const actionConfig: Record<EntityType, BulkAction[]> = {
  task: ['course', 'tags', 'priority', 'date', 'time', 'link', 'complete', 'delete'],
  deadline: ['course', 'tags', 'priority', 'date', 'time', 'link', 'complete', 'delete'],
  exam: ['course', 'tags', 'date', 'time', 'location', 'link', 'delete'],
  course: ['term', 'link', 'delete'],
};

const actionLabels: Record<BulkAction, { label: string; mobileLabel: string; icon: typeof FolderOpen }> = {
  course: { label: 'Course', mobileLabel: 'Course', icon: FolderOpen },
  tags: { label: 'Tags', mobileLabel: 'Tags', icon: Tag },
  priority: { label: 'Priority', mobileLabel: 'Priority', icon: Gauge },
  date: { label: 'Date', mobileLabel: 'Date', icon: Calendar },
  time: { label: 'Time', mobileLabel: 'Time', icon: Clock },
  link: { label: 'Add Link', mobileLabel: 'Link', icon: Link },
  complete: { label: 'Mark Done', mobileLabel: 'Done', icon: CheckCircle },
  delete: { label: 'Delete', mobileLabel: 'Delete', icon: Trash2 },
  location: { label: 'Location', mobileLabel: 'Location', icon: MapPin },
  term: { label: 'Term', mobileLabel: 'Term', icon: Calendar },
};

export default function BulkEditToolbar({
  selectedCount,
  entityType,
  onAction,
  onCancel,
  onSelectAll,
}: BulkEditToolbarProps) {
  const isMobile = useIsMobile();
  const availableActions = actionConfig[entityType];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: isMobile ? '12px 16px' : '16px 24px',
        backgroundColor: 'var(--panel)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto',
          gap: isMobile ? '8px' : '16px',
        }}
      >
        {/* Selected count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedCount} selected
          </span>
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              style={{
                fontSize: isMobile ? '12px' : '13px',
                color: 'var(--link)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Select all
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '6px',
            flexWrap: 'nowrap',
            overflow: 'auto',
          }}
        >
          {availableActions.filter(a => a !== 'delete').map((action) => {
            const config = actionLabels[action];
            const Icon = config.icon;
            // Use entity-specific labels for priority
            let label = config.label;
            if (action === 'priority') {
              label = entityType === 'task' ? 'Importance' : 'Effort';
            }
            return (
              <Button
                key={action}
                variant="secondary"
                size="sm"
                onClick={() => onAction(action)}
                style={{
                  flexShrink: 0,
                  padding: isMobile ? '6px 8px' : '8px 12px',
                }}
              >
                <Icon size={isMobile ? 14 : 16} />
                {!isMobile && label}
              </Button>
            );
          })}

          {/* Delete button */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => onAction('delete')}
            style={{
              flexShrink: 0,
              marginLeft: isMobile ? '4px' : '8px',
              padding: isMobile ? '6px 8px' : '8px 12px',
            }}
          >
            <Trash2 size={isMobile ? 14 : 16} />
            {!isMobile && 'Delete'}
          </Button>

          {/* Done button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onCancel}
            style={{
              flexShrink: 0,
              padding: isMobile ? '6px 10px' : '8px 14px',
            }}
          >
            <Check size={isMobile ? 14 : 16} />
            {!isMobile && 'Done'}
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            style={{
              flexShrink: 0,
              padding: isMobile ? '6px' : '8px',
              minWidth: 'auto',
            }}
            title="Close"
          >
            <X size={isMobile ? 14 : 16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
