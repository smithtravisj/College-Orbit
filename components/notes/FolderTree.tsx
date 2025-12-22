'use client';

import { useState } from 'react';
import { Folder, Edit2, Trash2 } from 'lucide-react';
import { Folder as FolderType } from '@/types/index';
import useAppStore from '@/lib/store';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
}: FolderTreeProps) {
  const isMobile = useIsMobile();
  const { deleteFolder, addFolder, updateFolder, settings } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeleteFolder = async (folderId: string) => {
    setDeleteConfirm(folderId);
    setContextMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await deleteFolder(deleteConfirm);
    } catch (err) {
      console.error('Failed to delete folder:', err);
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const startEditingFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder) {
      setEditingFolderId(folderId);
      setEditingName(folder.name);
    }
    setContextMenu(null);
  };

  const saveEditingFolder = async () => {
    if (!editingFolderId || !editingName.trim()) return;
    setLoading(true);
    try {
      const folder = folders.find((f) => f.id === editingFolderId);
      if (folder) {
        await updateFolder(editingFolderId, {
          name: editingName.trim(),
          parentId: folder.parentId,
          courseId: folder.courseId,
          colorTag: folder.colorTag,
          order: folder.order,
        });
      }
      setEditingFolderId(null);
      setEditingName('');
    } catch (err) {
      console.error('Failed to update folder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      await addFolder({
        name: newFolderName.trim(),
        parentId: null,
        courseId: null,
        colorTag: null,
        order: 0,
      });
      setNewFolderName('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    } finally {
      setLoading(false);
    }
  };

  const allRootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  // Light mode detection
  const isLightMode = settings.theme === 'light';
  const selectedTextColor = isLightMode ? '#000000' : 'white';
  const addFolderBgColor = isLightMode ? '#f0f0f0' : 'rgba(255,255,255,0.08)';
  const addFolderHoverBgColor = isLightMode ? '#e5e5e5' : 'rgba(255,255,255,0.12)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* All Notes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '8px',
          padding: isMobile ? '6px 6px 6px 12px' : '12px 8px 12px 16px',
          marginTop: isMobile ? '4px' : '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          backgroundColor: selectedFolderId === null ? 'var(--accent)' : 'transparent',
          color: selectedFolderId === null ? selectedTextColor : 'var(--text-muted)',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (selectedFolderId !== null) {
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedFolderId !== null) {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onClick={() => onSelectFolder(null)}
      >
        <Folder size={isMobile ? 14 : 16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>All Notes</span>
      </div>

      {/* Folders */}
      {allRootFolders.map((folder) => {
        const isSelected = selectedFolderId === folder.id;
        const isEditing = editingFolderId === folder.id;

        if (isEditing) {
          return (
            <div key={folder.id} style={{ marginBottom: '4px' }}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditingFolder();
                  if (e.key === 'Escape') {
                    setEditingFolderId(null);
                    setEditingName('');
                  }
                }}
                autoFocus
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--accent)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--input)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={folder.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '8px',
              padding: isMobile ? '6px 6px 6px 12px' : '12px 8px 12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
              color: isSelected ? selectedTextColor : 'var(--text-muted)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => onSelectFolder(folder.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY });
            }}
          >
            <Folder size={isMobile ? 14 : 16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
              {folder.name}
            </span>
          </div>
        );
      })}

      {/* Add Folder Button - Full Width Below */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          style={{
            width: '100%',
            padding: isMobile ? '6px' : '8px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            backgroundColor: addFolderBgColor,
            color: isLightMode ? '#000000' : 'white',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: '500',
            transition: 'all 150ms ease',
            marginTop: isMobile ? '2px' : '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = addFolderHoverBgColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = addFolderBgColor;
          }}
        >
          + Add folder
        </button>
      ) : (
        <div style={{ marginTop: '8px' }}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
              }
            }}
            autoFocus
            placeholder="Folder name"
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              backgroundColor: 'var(--input)',
              color: 'var(--text)',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}


      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              zIndex: 50,
              minWidth: '180px',
            }}
          >
            <button
              onClick={() => startEditingFolder(contextMenu.folderId)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => handleDeleteFolder(contextMenu.folderId)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
            }}
            onClick={() => !loading && setDeleteConfirm(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                width: '100%',
                margin: '0 16px',
                padding: '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: '0 0 12px 0' }}>
                Delete folder?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                This will delete the folder. Notes in it will become unfiled.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => !loading && setDeleteConfirm(null)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.opacity = '1';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
