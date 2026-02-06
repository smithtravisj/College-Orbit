'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Flashcard } from './types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { front: string; back: string }) => void;
  editingCard?: Flashcard | null;
  isMobile?: boolean;
}

export default function CreateCardModal({
  isOpen,
  onClose,
  onSubmit,
  editingCard,
  isMobile = false,
}: CreateCardModalProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front);
      setBack(editingCard.back);
    } else {
      setFront('');
      setBack('');
    }
  }, [editingCard, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!front.trim() || !back.trim()) return;
    onSubmit({
      front: front.trim(),
      back: back.trim(),
    });
    setFront('');
    setBack('');
  };

  return (
    <div style={{
      padding: isMobile ? '12px' : '16px',
      backgroundColor: 'var(--panel-2)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          {editingCard ? 'Edit Card' : 'Add New Card'}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Front (Question/Term)
          </label>
          <Input
            placeholder="Enter the question or term"
            value={front}
            onChange={(e) => setFront(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Back (Answer/Definition)
          </label>
          <Input
            placeholder="Enter the answer or definition"
            value={back}
            onChange={(e) => setBack(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {editingCard ? 'Save' : 'Add Card'}
          </Button>
        </div>
      </div>
    </div>
  );
}
