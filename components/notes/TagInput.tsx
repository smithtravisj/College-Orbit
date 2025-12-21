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
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-3 bg-[var(--panel-2)] rounded-lg border border-[var(--border)]">
        {tags.map((tag, idx) => (
          <div
            key={idx}
            className="bg-[var(--accent)] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="hover:opacity-75 transition-opacity"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <div className="relative flex-1 min-w-[100px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-[var(--text)] outline-none placeholder-[var(--text-muted)]"
            autoComplete="off"
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-lg z-10"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    idx === selectedSuggestionIndex
                      ? 'bg-[var(--accent)] text-white'
                      : 'hover:bg-[var(--panel-2)] text-[var(--text)]'
                  }`}
                  onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                  onMouseLeave={() => setSelectedSuggestionIndex(-1)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-[var(--text-muted)]" style={{ marginTop: '6px', marginBottom: '16px' }}>
        Type to search existing tags, press Enter or comma to add new tag
      </p>
    </div>
  );
}
