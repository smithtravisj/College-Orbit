'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, File, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import Button from '@/components/ui/Button';

interface FileItem {
  name: string;
  url: string;
  size: number;
}

interface FileUploadProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ files = [], onChange, maxFiles = 10, maxSizeMB = 10, label }: FileUploadProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const newFiles: FileItem[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
          continue;
        }

        // Check max files
        if (files.length + newFiles.length >= maxFiles) {
          setError(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Upload file
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to upload file');
          continue;
        }

        const data = await response.json();
        newFiles.push(data.file);
      }

      if (newFiles.length > 0) {
        onChange([...files, ...newFiles]);
      }
    } catch (err) {
      setError('Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (index: number) => {
    const fileToRemove = files[index];

    // Optimistically remove from UI
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);

    // Delete from storage (fire and forget)
    try {
      await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileToRemove.url }),
      });
    } catch (err) {
      console.error('Failed to delete file from storage:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
      {/* Header row with label and add button */}
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={isMobile ? 'text-sm font-medium text-[var(--text)]' : 'text-lg font-medium text-[var(--text)]'}>{label}</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || files.length >= maxFiles}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '2px 6px' : '3px 8px',
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              color: 'var(--text-muted)',
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              cursor: uploading || files.length >= maxFiles ? 'not-allowed' : 'pointer',
              opacity: uploading || files.length >= maxFiles ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!uploading && files.length < maxFiles) {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {uploading ? (
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={12} />
            )}
            {uploading ? 'Uploading...' : 'Add'}
          </button>
        </div>
      )}

      {/* Hidden input when no label */}
      {!label && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}

      {/* File list */}
      {files.map((file, index) => (
        <div
          key={`${index}-${file.name}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '6px 8px' : '8px 12px',
            backgroundColor: 'var(--panel-2)',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--border)',
          }}
        >
          <File size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {file.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {formatFileSize(file.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(index)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--panel)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}

      {/* Upload button when no label provided */}
      {!label && (
        <Button
          variant="secondary"
          size={isMobile ? 'sm' : 'md'}
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
        >
          {uploading ? (
            <Loader2 size={isMobile ? 14 : 16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={isMobile ? 14 : 16} />
          )}
          {uploading ? 'Uploading...' : 'Add Files'}
        </Button>
      )}

      {/* Error message */}
      {error && (
        <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
