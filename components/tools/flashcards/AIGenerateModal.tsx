'use client';

import { useState, useRef } from 'react';
import { Sparkles, X, FileText, Upload, Pencil, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

interface GeneratedCard {
  front: string;
  back: string;
}

interface AIGenerateModalProps {
  onSave: (cards: GeneratedCard[]) => void;
  onClose: () => void;
  isMobile?: boolean;
}

type InputMode = 'text' | 'file';
type Step = 'input' | 'generating' | 'review';

export default function AIGenerateModal({ onSave, onClose, isMobile = false }: AIGenerateModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setStep('generating');
    setError(null);

    try {
      const formData = new FormData();
      if (inputMode === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', inputText);
      }

      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flashcards');
      }

      setGeneratedCards(data.cards);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('input');
    }
  };

  const handleRemoveCard = (index: number) => {
    setGeneratedCards(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditFront(generatedCards[index].front);
    setEditBack(generatedCards[index].back);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    setGeneratedCards(prev => prev.map((card, i) =>
      i === editingIndex ? { front: editFront.trim(), back: editBack.trim() } : card
    ));
    setEditingIndex(null);
  };

  const ACCEPTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be under 10MB');
        return;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Supported file types: PDF, PNG, JPG, WebP, GIF');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const canGenerate = inputMode === 'text'
    ? inputText.trim().length >= 50
    : selectedFile !== null;

  return (
    <div style={{
      padding: isMobile ? '12px' : '16px',
      backgroundColor: 'var(--panel-2)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
            <Sparkles size={16} />
            AI Generate Flashcards
          </div>
          {step !== 'generating' && (
            <button
              onClick={onClose}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Step 1: Input */}
        {step === 'input' && (
          <>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => { setInputMode('text'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: inputMode === 'text' ? 'var(--panel-2)' : 'transparent',
                  color: inputMode === 'text' ? 'var(--text)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <FileText size={14} />
                Paste Notes
              </button>
              <button
                onClick={() => { setInputMode('file'); setError(null); }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: inputMode === 'file' ? 'var(--panel-2)' : 'transparent',
                  color: inputMode === 'file' ? 'var(--text)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload size={14} />
                Upload File
              </button>
            </div>

            {/* Text input */}
            {inputMode === 'text' && (
              <>
                <textarea
                  placeholder="Paste your lecture notes, study material, or any text content here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '180px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' }}>
                  {inputText.length.toLocaleString()} / 60,000 characters
                  {inputText.length > 0 && inputText.length < 50 && (
                    <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>
                      (minimum 50 characters)
                    </span>
                  )}
                  {inputText.length > 60000 && (
                    <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>
                      (over limit — content will be truncated)
                    </span>
                  )}
                </div>
              </>
            )}

            {/* PDF input */}
            {inputMode === 'file' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '24px',
                  borderRadius: '8px',
                  border: '2px dashed var(--border)',
                  backgroundColor: 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <FileText size={24} style={{ color: 'var(--link)' }} />
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {selectedFile.size >= 1024 * 1024
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(selectedFile.size / 1024).toFixed(0)} KB`
                      } — Click to change
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      Click to select a file
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      PDF, PNG, JPG, WebP, GIF — Max 10MB
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{
                fontSize: '13px',
                color: 'var(--danger)',
                padding: '8px 12px',
                backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
                borderRadius: '8px',
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleGenerate} disabled={!canGenerate}>
                <Sparkles size={14} />
                Generate Flashcards
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '32px 16px',
          }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--link)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Generating flashcards...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Generated {generatedCards.length} flashcard{generatedCards.length !== 1 ? 's' : ''}. Review, edit, or remove cards before saving.
            </div>

            {/* Card list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}>
              {generatedCards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  {editingIndex === index ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        placeholder="Front"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--panel-2)',
                          color: 'var(--text)',
                          fontSize: '13px',
                        }}
                      />
                      <input
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        placeholder="Back"
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--panel-2)',
                          color: 'var(--text)',
                          fontSize: '13px',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" size="sm" onClick={() => setEditingIndex(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={!editFront.trim() || !editBack.trim()}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                          {card.front}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {card.back}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleStartEdit(index)}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleRemoveCard(index)}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {generatedCards.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                All cards removed. Regenerate or cancel.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setGeneratedCards([]);
                  setStep('input');
                }}
              >
                <RotateCcw size={14} />
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={() => onSave(generatedCards)}
                disabled={generatedCards.length === 0}
              >
                Save {generatedCards.length} Card{generatedCards.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
