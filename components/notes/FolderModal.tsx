'use client';

import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import useAppStore from '@/lib/store';
import { Course } from '@/types/index';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFolderId?: string | null;
  courses: Course[];
}

export default function FolderModal({ isOpen, onClose, editingFolderId, courses }: FolderModalProps) {
  const { folders, addFolder, updateFolder, deleteFolder } = useAppStore();
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const editingFolder = editingFolderId ? folders.find(f => f.id === editingFolderId) : null;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingFolder) {
        setName(editingFolder.name);
        setCourseId(editingFolder.courseId || null);
      } else {
        setName('');
        setCourseId(null);
      }
      setError('');
    }
  }, [isOpen, editingFolder]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Folder name is required');
      return false;
    }

    // Check for duplicate folder names
    const duplicateFolder = folders.filter(
      f =>
        f.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        f.id !== editingFolderId
    );

    if (duplicateFolder.length > 0) {
      setError('A folder with this name already exists');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingFolder) {
        await updateFolder(editingFolder.id, {
          name: name.trim(),
          parentId: null,
          courseId,
        });
      } else {
        await addFolder({
          name: name.trim(),
          parentId: null,
          courseId,
          colorTag: null,
          order: 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingFolder) return;
    if (!window.confirm('Are you sure you want to delete this folder? Notes in it will become unfiled.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteFolder(editingFolder.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--panel)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '448px',
          width: '100%',
          margin: '0 16px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            padding: '16px',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--panel)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>
            {editingFolder ? 'Edit Folder' : 'New Folder'}
          </h2>
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Folder Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '8px' }}>
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lecture Notes"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--input)',
                color: 'var(--text)',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={loading}
            />
          </div>

          {/* Course */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text)', marginBottom: '8px' }}>
              Course (optional)
            </label>
            <select
              value={courseId || ''}
              onChange={(e) => setCourseId(e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                backgroundColor: 'var(--input)',
                color: 'var(--text)',
                fontSize: '14px',
                boxSizing: 'border-box',
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={loading}
            >
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '12px' }}>
            {editingFolder && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'background-color 150ms ease',
                  color: '#dc2626',
                  border: 'none',
                  background: 'transparent',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'background-color 150ms ease',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'opacity 150ms ease',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.opacity = '1';
              }}
            >
              {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {editingFolder ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
