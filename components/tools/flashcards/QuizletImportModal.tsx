'use client';

import { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';

interface QuizletImportModalProps {
  onImport: (cards: { front: string; back: string }[]) => void;
  onClose: () => void;
  isMobile?: boolean;
}

type Delimiter = 'tab' | 'comma' | 'semicolon';

const DELIMITER_MAP: Record<Delimiter, string> = {
  tab: '\t',
  comma: ',',
  semicolon: ';',
};

const DELIMITER_LABELS: Record<Delimiter, string> = {
  tab: 'Tab',
  comma: 'Comma',
  semicolon: 'Semicolon',
};

export default function QuizletImportModal({ onImport, onClose, isMobile = false }: QuizletImportModalProps) {
  const [text, setText] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>('tab');

  const parsedCards = useMemo(() => {
    if (!text.trim()) return [];
    const sep = DELIMITER_MAP[delimiter];
    return text
      .trim()
      .split('\n')
      .map(line => {
        const idx = line.indexOf(sep);
        if (idx === -1) return null;
        const front = line.slice(0, idx).trim();
        const back = line.slice(idx + sep.length).trim();
        if (!front || !back) return null;
        return { front, back };
      })
      .filter(Boolean) as { front: string; back: string }[];
  }, [text, delimiter]);

  const handleImport = () => {
    if (parsedCards.length === 0) return;
    onImport(parsedCards);
  };

  return (
    <div style={{
      padding: isMobile ? '12px' : '16px',
      backgroundColor: 'var(--panel-2)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
          Quizlet Import
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Paste your Quizlet export text below. Each line should have a term and definition separated by the chosen delimiter.
        </div>

        {/* Delimiter selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Delimiter:</span>
          {(Object.keys(DELIMITER_MAP) as Delimiter[]).map(d => (
            <button
              key={d}
              onClick={() => setDelimiter(d)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: `1px solid ${delimiter === d ? 'var(--link)' : 'var(--border)'}`,
                backgroundColor: delimiter === d ? 'var(--link)15' : 'transparent',
                color: delimiter === d ? 'var(--link)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {DELIMITER_LABELS[d]}
            </button>
          ))}
        </div>

        <textarea
          placeholder={`term${DELIMITER_MAP[delimiter]}definition\nterm2${DELIMITER_MAP[delimiter]}definition2`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'monospace',
            resize: 'vertical',
          }}
        />

        {/* Preview */}
        {parsedCards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Preview ({parsedCards.length} cards)
            </div>
            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {parsedCards.slice(0, 10).map((card, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg)',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.front}
                  </span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>&rarr;</span>
                  <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.back}
                  </span>
                </div>
              ))}
              {parsedCards.length > 10 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>
                  ...and {parsedCards.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        {text.trim() && parsedCards.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--error, #f87171)' }}>
            No valid cards found. Make sure each line has a term and definition separated by the selected delimiter.
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleImport} disabled={parsedCards.length === 0}>
            Import {parsedCards.length > 0 ? `${parsedCards.length} Cards` : 'Cards'}
          </Button>
        </div>
      </div>
    </div>
  );
}
