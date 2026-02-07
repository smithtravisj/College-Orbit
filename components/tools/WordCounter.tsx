'use client';

import { useState, useMemo } from 'react';

interface WordCounterProps {
  theme?: string;
}

export default function WordCounter({ theme: _theme }: WordCounterProps) {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmedText = text.trim();

    // Character counts
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // Word count - split by whitespace and filter empty strings
    const words = trimmedText ? trimmedText.split(/\s+/).filter(w => w.length > 0).length : 0;

    // Sentence count - split by sentence-ending punctuation
    const sentences = trimmedText ? (trimmedText.match(/[.!?]+(?:\s|$)/g) || []).length : 0;

    // Paragraph count - each non-empty line counts as a paragraph
    const paragraphs = trimmedText ? trimmedText.split(/\n/).filter(p => p.trim().length > 0).length : 0;

    // Reading time (average 200 words per minute)
    const readingTimeMinutes = words / 200;
    let readingTime: string;
    if (readingTimeMinutes < 1) {
      const seconds = Math.ceil(readingTimeMinutes * 60);
      readingTime = `${seconds} sec`;
    } else if (readingTimeMinutes < 60) {
      const mins = Math.round(readingTimeMinutes);
      readingTime = `${mins} min`;
    } else {
      const hours = Math.floor(readingTimeMinutes / 60);
      const mins = Math.round(readingTimeMinutes % 60);
      readingTime = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }

    // Speaking time (average 150 words per minute)
    const speakingTimeMinutes = words / 150;
    let speakingTime: string;
    if (speakingTimeMinutes < 1) {
      const seconds = Math.ceil(speakingTimeMinutes * 60);
      speakingTime = `${seconds} sec`;
    } else if (speakingTimeMinutes < 60) {
      const mins = Math.round(speakingTimeMinutes);
      speakingTime = `${mins} min`;
    } else {
      const hours = Math.floor(speakingTimeMinutes / 60);
      const mins = Math.round(speakingTimeMinutes % 60);
      speakingTime = mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    }

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
    };
  }, [text]);

  const statItems = [
    { label: 'Words', value: stats.words },
    { label: 'Characters', value: stats.characters },
    { label: 'Sentences', value: stats.sentences },
    { label: 'Paragraphs', value: stats.paragraphs },
    { label: 'Reading Time', value: stats.readingTime },
    { label: 'Speaking Time', value: stats.speakingTime },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Text Input */}
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
          Enter or paste your text
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here..."
          style={{
            width: '100%',
            minHeight: '150px',
            padding: '12px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            fontSize: '15px',
            color: 'var(--text)',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
        }}
      >
        {statItems.map((item) => (
          <div
            key={item.label}
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--link)',
                marginBottom: '4px',
              }}
            >
              {item.value}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Clear Button */}
      {text && (
        <button
          onClick={() => setText('')}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-control)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          Clear Text
        </button>
      )}
    </div>
  );
}
