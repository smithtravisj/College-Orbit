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
import { Plus, Trash2, Edit2, Pin, Folder as FolderIcon, Tag, Link as LinkIcon } from 'lucide-react';

export default function NotesPage() {
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    content: { type: 'doc', content: [] },
    folderId: '',
    courseId: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
  });

  const { courses, notes, folders, addNote, updateNote, deleteNote, toggleNotePin, initializeStore } = useAppStore();

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
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(id);
      setSelectedNoteId(null);
      setShowForm(false);
    }
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

              {/* Folder filter with tree view */}
              <div style={{ marginBottom: '0' }}>
                <h4 className="text-sm font-semibold text-[var(--text)] mb-6">Folders</h4>
                <FolderTree
                  folders={folders}
                  notes={notes}
                  selectedFolderId={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                />
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Tags</h4>
                  <div className="space-y-2">
                    {allTags.map((tag) => (
                      <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer hover:text-[var(--text)] p-2 rounded hover:bg-white/5 transition-colors">
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
                          className="rounded"
                        />
                        <Tag size={12} />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Main content - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      label="Course (optional)"
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      options={[{ value: '', label: 'No Course' }, ...courses.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}
                    />
                    <Select
                      label="Folder (optional)"
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
              <div style={{ marginBottom: '24px' }}>
                <Card>
                <div className="space-y-3 divide-y divide-[var(--border)]">
                  {filtered.map((note) => {
                    const course = courses.find((c) => c.id === note.courseId);
                    const folder = folders.find((f) => f.id === note.folderId);

                    return (
                      <div
                        key={note.id}
                        className="first:pt-0 pt-3 group hover:bg-[var(--panel-2)] -mx-6 px-6 rounded transition-colors cursor-pointer"
                        onClick={() => setSelectedNoteId(note.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {note.isPinned && <Pin size={14} className="text-[var(--accent)]" />}
                              <h3 className="text-sm font-semibold text-[var(--text)]">{note.title}</h3>
                            </div>
                            {note.plainText && (
                              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                                {note.plainText}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {course && <span className="text-xs bg-[var(--nav-active)] px-2 py-1 rounded">{course.code}</span>}
                              {folder && (
                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                  <FolderIcon size={12} />
                                  {folder.name}
                                </span>
                              )}
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {note.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="text-xs text-[var(--accent)]">
                                      #{tag}
                                    </span>
                                  ))}
                                  {note.tags.length > 2 && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                      +{note.tags.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNotePin(note.id);
                              }}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)]"
                              title={note.isPinned ? 'Unpin note' : 'Pin note'}
                            >
                              <Pin size={16} className={note.isPinned ? 'fill-current' : ''} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(note);
                              }}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--accent)]"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)]"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </Card>
              </div>
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

    </>
  );
}
