'use client';

import { Select } from '@/components/ui/Input';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import { FlashcardSettings as FlashcardSettingsType, SortOption, StudyMode } from './types';

interface FlashcardSettingsProps {
  settings: FlashcardSettingsType;
  onSettingsChange: (settings: Partial<FlashcardSettingsType>) => void;
  isMobile?: boolean;
}

export default function FlashcardSettings({
  settings,
  onSettingsChange,
  isMobile = false,
}: FlashcardSettingsProps) {
  const modeOptions: { value: StudyMode; label: string }[] = [
    { value: 'flashcard', label: 'Flashcards' },
    { value: 'type', label: 'Type Answer' },
    { value: 'match', label: 'Match' },
  ];

  const cardsPerSessionOptions = [
    { value: '10', label: '10 cards' },
    { value: '20', label: '20 cards' },
    { value: '50', label: '50 cards' },
    { value: '0', label: 'All cards' },
  ];

  const dailyGoalOptions = [
    { value: '10', label: '10 cards' },
    { value: '20', label: '20 cards' },
    { value: '30', label: '30 cards' },
    { value: '50', label: '50 cards' },
    { value: '100', label: '100 cards' },
  ];

  const autoFlipOptions = [
    { value: '0', label: 'Off' },
    { value: '3', label: '3 seconds' },
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recently studied' },
    { value: 'due', label: 'Most cards due' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'course', label: 'By course' },
    { value: 'mastery', label: 'Mastery level' },
    { value: 'created', label: 'Recently created' },
  ];

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) => (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
      padding: '8px 0',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      />
      <span style={{ fontSize: '14px', color: 'var(--text)' }}>{label}</span>
    </label>
  );

  return (
    <CollapsibleCard
      id="flashcard-settings"
      title="Study Settings"
      subtitle="Customize your flashcard study experience"
      initialOpen={false}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '16px' : '20px',
      }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Default Study Mode"
            value={settings.defaultMode}
            onChange={(e) => onSettingsChange({ defaultMode: e.target.value as StudyMode })}
            options={modeOptions}
          />

          <Select
            label="Cards per Session"
            value={settings.cardsPerSession.toString()}
            onChange={(e) => onSettingsChange({ cardsPerSession: parseInt(e.target.value) })}
            options={cardsPerSessionOptions}
          />

          <Select
            label="Daily Goal"
            value={settings.dailyGoal.toString()}
            onChange={(e) => onSettingsChange({ dailyGoal: parseInt(e.target.value) })}
            options={dailyGoalOptions}
          />

          <Select
            label="Auto-flip Delay"
            value={settings.autoFlipDelay.toString()}
            onChange={(e) => onSettingsChange({ autoFlipDelay: parseInt(e.target.value) })}
            options={autoFlipOptions}
          />

          <Select
            label="Default Sort Order"
            value={settings.defaultSort}
            onChange={(e) => onSettingsChange({ defaultSort: e.target.value as SortOption })}
            options={sortOptions}
          />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Options
          </div>

          <Checkbox
            checked={settings.shuffleCards}
            onChange={(checked) => onSettingsChange({ shuffleCards: checked })}
            label="Shuffle cards"
          />

          <Checkbox
            checked={settings.showKeyboardHints}
            onChange={(checked) => onSettingsChange({ showKeyboardHints: checked })}
            label="Show keyboard shortcuts"
          />

          <Checkbox
            checked={settings.soundEffects}
            onChange={(checked) => onSettingsChange({ soundEffects: checked })}
            label="Sound effects"
          />

          <Checkbox
            checked={settings.celebrations}
            onChange={(checked) => onSettingsChange({ celebrations: checked })}
            label="Celebration animations"
          />
        </div>
      </div>
    </CollapsibleCard>
  );
}
