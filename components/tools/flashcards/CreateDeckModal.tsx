'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { Course, FlashcardDeck } from './types';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; courseId: string }) => void;
  courses: Course[];
  editingDeck?: FlashcardDeck | null;
  isMobile?: boolean;
}

export default function CreateDeckModal({
  isOpen,
  onClose,
  onSubmit,
  courses,
  editingDeck,
  isMobile = false,
}: CreateDeckModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    if (editingDeck) {
      setName(editingDeck.name);
      setDescription(editingDeck.description || '');
      setCourseId(editingDeck.courseId || '');
    } else {
      setName('');
      setDescription('');
      setCourseId('');
    }
  }, [editingDeck, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      courseId,
    });
    setName('');
    setDescription('');
    setCourseId('');
  };

  return (
    <div style={{
      padding: isMobile ? '12px' : '16px',
      backgroundColor: 'var(--panel-2)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
          {editingDeck ? 'Edit Deck' : 'Create New Deck'}
        </div>
        <Input
          placeholder="Deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          options={[
            { value: '', label: 'No course (optional)' },
            ...courses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` })),
          ]}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            {editingDeck ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
