'use client';

import { useEffect, useState } from 'react';
import useAppStore from '@/lib/store';
import { Note } from '@/types';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import RichTextEditor from '@/components/RichTextEditor';
import FolderTree from '@/components/notes/FolderTree';
import TagInput from '@/components/notes/TagInput';
import { Plus, Trash2, Edit2, Pin, Folder as FolderIcon, Link as LinkIcon, ChevronDown } from 'lucide-react';

export default function NotesPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showFoldersDropdown, setShowFoldersDropdown] = useState(true);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: { type: 'doc', content: [] },
    folderId: '',
    courseId: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
  });

  const { courses, notes, folders, settings, addNote, updateNote, deleteNote, toggleNotePin, initializeStore } = useAppStore();

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const links = formData.links
      .filter((l) => l.url && l.url.trim())
      .map((l) => ({
        label: l.label,
        url: l.url.startsWith('http') ? l.url : `https://${l.url}`,
      }));

    if (editingId) {
      await updateNote(editingId, {
        title: formData.title,
        content: formData.content,
        folderId: formData.folderId || null,
        courseId: formData.courseId || null,
        tags: formData.tags,
        links,
      });
      setEditingId(null);
      setSelectedNoteId(null);
    } else {
      await addNote({
        title: formData.title,
        content: formData.content,
        folderId: formData.folderId || null,
        courseId: formData.courseId || null,
        tags: formData.tags,
        isPinned: false,
        links,
      });
    }

    resetForm();
    setShowForm(false);
  };

  const startEdit = (note: Note) => {
    setSelectedNoteId(note.id);
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content || { type: 'doc', content: [] },
      folderId: note.folderId || '',
      courseId: note.courseId || '',
      tags: note.tags || [],
      links: note.links && note.links.length > 0 ? note.links : [{ label: '', url: '' }],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: { type: 'doc', content: [] },
      folderId: '',
      courseId: '',
      tags: [],
      links: [{ label: '', url: '' }],
    });
  };

  const handleDeleteNote = async (id: string) => {
    setDeleteConfirmNote(id);
  };

  const confirmDeleteNote = async () => {
    if (!deleteConfirmNote) return;
    await deleteNote(deleteConfirmNote);
    setSelectedNoteId(null);
    setShowForm(false);
    setDeleteConfirmNote(null);
  };

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Filter and search notes
  const filtered = notes
    .filter((note) => {
      if (selectedFolder && note.folderId !== selectedFolder) return false;
      if (selectedTags.size > 0 && !note.tags?.some((t) => selectedTags.has(t))) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === note.courseId);
      const folder = folders.find((f) => f.id === note.folderId);

      return (
        note.title.toLowerCase().includes(query) ||
        note.plainText?.toLowerCase().includes(query) ||
        note.tags?.some((t) => t.toLowerCase().includes(query)) ||
        course?.code.toLowerCase().includes(query) ||
        course?.name.toLowerCase().includes(query) ||
        folder?.name.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Pinned first, then by updated date
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const selectedNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null;
  const pinnedNotes = filtered.filter((n) => n.isPinned);
  const unpinnedNotes = filtered.filter((n) => !n.isPinned);

  // Light mode detection for delete button
  const isLightMode = settings.theme === 'light';
  const deleteButtonBgColor = isLightMode ? '#e63946' : '#660000';
  const deleteButtonTextColor = isLightMode ? 'white' : 'var(--text)';

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Organize your study notes with rich text formatting"
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            <Plus size={18} />
            New Note
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', overflow: 'visible' }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ overflow: 'visible' }}>
          {/* Sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content' }}>
            <Card>
              <div style={{ marginBottom: '20px' }}>
                <Input
                  label="Search notes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                />
              </div>

              {/* Folder filter dropdown */}
              <div style={{ marginBottom: '0', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowFoldersDropdown(!showFoldersDropdown)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Folders</span>
                  <ChevronDown size={16} style={{ transform: showFoldersDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
                </button>
                {showFoldersDropdown && (
                  <div style={{ marginTop: '0px' }}>
                    <FolderTree
                      folders={folders}
                      selectedFolderId={selectedFolder}
                      onSelectFolder={setSelectedFolder}
                    />
                  </div>
                )}
              </div>

              {/* Tag filter dropdown */}
              {allTags.length > 0 && (
                <div style={{ marginTop: '20px', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Tags</span>
                    <ChevronDown size={16} style={{ transform: showTagsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
                  </button>
                  {showTagsDropdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '0px' }}>
                      {allTags.map((tag) => (
                        <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: 'var(--text-muted)', minWidth: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                          <input
                            type="checkbox"
                            checked={selectedTags.has(tag)}
                            onChange={(e) => {
                              const newTags = new Set(selectedTags);
                              if (e.target.checked) {
                                newTags.add(tag);
                              } else {
                                newTags.delete(tag);
                              }
                              setSelectedTags(newTags);
                            }}
                            style={{ borderRadius: '4px', flexShrink: 0 }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Main content - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Form */}
            {showForm && (
              <div style={{ marginBottom: '24px' }}>
                <Card>
                  <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Note title"
                    required
                  />

                  <div className="grid grid-cols-2 gap-4" style={{ marginTop: '16px' }}>
                    <Select
                      label="Course"
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}
                    />
                    <Select
                      label="Folder"
                      value={formData.folderId}
                      onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                      options={[
                        { value: '', label: 'No Folder' },
                        ...folders.filter((f) => !f.parentId).map((f) => ({ value: f.id, label: f.name })),
                      ]}
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                    />
                  </div>

                  {/* Tags input with suggestions */}
                  <div style={{ marginTop: '-6px' }}>
                    <label className="block text-sm font-medium text-[var(--text)]" style={{ marginBottom: '12px' }}>Tags</label>
                    <TagInput
                      tags={formData.tags}
                      onTagsChange={(tags) => setFormData({ ...formData, tags })}
                      allAvailableTags={allTags}
                      placeholder="Add tag..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="primary" type="submit">
                      {editingId ? 'Save Changes' : 'Create Note'}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                        setSelectedNoteId(null);
                        setEditingId(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
                </Card>
              </div>
            )}

            {/* Notes list or detail view */}
            {selectedNote && !showForm ? (
              <div style={{ marginBottom: '24px' }}>
                <Card>
                  <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-[var(--text)]">{selectedNote.title}</h2>
                        {selectedNote.isPinned && (
                          <Pin size={20} className="text-[var(--accent)]" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
                        {selectedNote.courseId && (
                          <span>{courses.find((c) => c.id === selectedNote.courseId)?.code}</span>
                        )}
                        {selectedNote.folderId && (
                          <span className="flex items-center gap-1">
                            <FolderIcon size={14} />
                            {folders.find((f) => f.id === selectedNote.folderId)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toggleNotePin(selectedNote.id)}
                        title={selectedNote.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin size={16} className={selectedNote.isPinned ? 'fill-current' : ''} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(selectedNote)}
                      >
                        <Edit2 size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteNote(selectedNote.id)}
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Rich text content display */}
                  <div className="prose prose-sm max-w-none bg-[var(--panel-2)] p-4 rounded-lg text-[var(--text)]">
                    {selectedNote.tags && selectedNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedNote.tags.map((tag) => (
                          <span key={tag} className="bg-[var(--accent)] text-white px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedNote.plainText || 'No content'}
                    </div>
                  </div>

                  {selectedNote.links && selectedNote.links.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                        <LinkIcon size={16} />
                        Links
                      </h4>
                      <ul className="space-y-1">
                        {selectedNote.links.map((link, idx) => (
                          <li key={idx}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--accent)] hover:underline"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
                    Last updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedNoteId(null)}
                  >
                    Back to List
                  </Button>
                  </div>
                </Card>
              </div>
            ) : filtered.length > 0 ? (
              <>
                {pinnedNotes.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px', marginTop: 0 }}>Pinned Notes</h4>
                    <Card>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {pinnedNotes.map((note, index) => {
                          const course = courses.find((c) => c.id === note.courseId);
                          const folder = folders.find((f) => f.id === note.folderId);

                          return (
                            <div
                              key={note.id}
                              style={{ padding: '12px 0', borderBottom: index < pinnedNotes.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 150ms ease' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                                const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                if (buttonsDiv) buttonsDiv.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                if (buttonsDiv) buttonsDiv.style.opacity = '0';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{note.title}</h3>
                                  {note.plainText && (
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                      {note.plainText}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    {course && <span style={{ fontSize: '12px', backgroundColor: 'var(--nav-active)', padding: '4px 8px', borderRadius: '4px' }}>{course.code}</span>}
                                    {folder && selectedFolder !== note.folderId && (
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FolderIcon size={12} />
                                        {folder.name}
                                      </span>
                                    )}
                                    {note.tags && note.tags.length > 0 && (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {note.tags.slice(0, 2).map((tag) => {
                                          const hasCollege = settings?.university;
                                          const isLightMode = settings?.theme === 'light';
                                          const tagColor = hasCollege
                                            ? (isLightMode ? 'var(--accent)' : 'var(--calendar-current-date-color)')
                                            : '#539bf5';
                                          return (
                                            <span key={tag} style={{ fontSize: '12px', color: tagColor }}>
                                              #{tag}
                                            </span>
                                          );
                                        })}
                                        {note.tags.length > 2 && (
                                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            +{note.tags.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div data-buttons-container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0, transition: 'opacity 150ms ease' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotePin(note.id);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#539bf5'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                    title="Unpin note"
                                  >
                                    <Pin size={20} style={{ fill: 'currentColor' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(note);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#539bf5'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Edit2 size={20} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f85149'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                )}
                {unpinnedNotes.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    {pinnedNotes.length > 0 && (
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '12px', marginTop: 0 }}>All Notes</h4>
                    )}
                    <Card>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {unpinnedNotes.map((note, index) => {
                          const course = courses.find((c) => c.id === note.courseId);
                          const folder = folders.find((f) => f.id === note.folderId);

                          return (
                            <div
                              key={note.id}
                              style={{ padding: '12px 0', borderBottom: index < unpinnedNotes.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 150ms ease' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                                const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                if (buttonsDiv) buttonsDiv.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                if (buttonsDiv) buttonsDiv.style.opacity = '0';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{note.title}</h3>
                                  {note.plainText && (
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                      {note.plainText}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    {course && <span style={{ fontSize: '12px', backgroundColor: 'var(--nav-active)', padding: '4px 8px', borderRadius: '4px' }}>{course.code}</span>}
                                    {folder && selectedFolder !== note.folderId && (
                                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FolderIcon size={12} />
                                        {folder.name}
                                      </span>
                                    )}
                                    {note.tags && note.tags.length > 0 && (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {note.tags.slice(0, 2).map((tag) => {
                                          const hasCollege = settings?.university;
                                          const isLightMode = settings?.theme === 'light';
                                          const tagColor = hasCollege
                                            ? (isLightMode ? 'var(--accent)' : 'var(--calendar-current-date-color)')
                                            : '#539bf5';
                                          return (
                                            <span key={tag} style={{ fontSize: '12px', color: tagColor }}>
                                              #{tag}
                                            </span>
                                          );
                                        })}
                                        {note.tags.length > 2 && (
                                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            +{note.tags.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div data-buttons-container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0, transition: 'opacity 150ms ease' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotePin(note.id);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#539bf5'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                    title="Pin note"
                                  >
                                    <Pin size={20} style={{ fill: 'none' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(note);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#539bf5'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Edit2 size={20} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    style={{ padding: '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f85149'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                title="No notes"
                description={
                  selectedFolder || selectedTags.size > 0 || searchQuery
                    ? 'No notes match your filters. Try adjusting your search.'
                    : 'Create your first note to get started'
                }
                action={{ label: 'Create Note', onClick: () => { resetForm(); setShowForm(true); } }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmNote && (
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
            onClick={() => setDeleteConfirmNote(null)}
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
                Delete note?
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
                This will permanently delete this note. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setDeleteConfirmNote(null)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteNote}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    backgroundColor: deleteButtonBgColor,
                    color: deleteButtonTextColor,
                    cursor: 'pointer',
                    transition: 'opacity 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
}
