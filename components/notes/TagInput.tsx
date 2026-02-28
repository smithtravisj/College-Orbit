'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  allAvailableTags: string[];
  placeholder?: string;
}

export default function TagInput({
  tags,
  onTagsChange,
  allAvailableTags,
  placeholder = 'Add tag...',
}: TagInputProps) {
  const tagTextColor = 'var(--accent-text)';

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update suggestions based on input
  useEffect(() => {
    if (inputValue.trim().length === 0) {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    const lowerInput = inputValue.toLowerCase();
    const filtered = allAvailableTags.filter(
      (tag) =>
        tag.toLowerCase().startsWith(lowerInput) &&
        !tags.includes(tag) // Don't suggest already added tags
    );

    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    setSelectedSuggestionIndex(-1);
  }, [inputValue, tags, allAvailableTags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setSuggestions([]);
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--panel-2)',
          cursor: 'text',
        }}
      >
        {tags.map((tag, idx) => (
          <div
            key={idx}
            style={{ backgroundColor: 'var(--accent)', color: tagTextColor, padding: '2px 10px', borderRadius: '9999px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '1.4', flexShrink: 0 }}
          >
            {tag}
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, opacity: 1, transition: 'opacity 150ms ease', display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              aria-label={`Remove tag ${tag}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            flex: 1,
            minWidth: '80px',
            backgroundColor: 'transparent',
            color: 'var(--text)',
            outline: 'none',
            border: 'none',
            borderRadius: 0,
            padding: '4px 0',
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.5',
          }}
          autoComplete="off"
        />
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'var(--panel-solid, var(--panel))', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10 }}
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: '14px',
                transition: 'background-color 150ms ease',
                backgroundColor: idx === selectedSuggestionIndex ? 'var(--accent)' : 'transparent',
                color: idx === selectedSuggestionIndex ? tagTextColor : 'var(--text)',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(idx)}
              onMouseLeave={() => setSelectedSuggestionIndex(-1)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
