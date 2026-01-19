'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import useAppStore from '@/lib/store';
import { Note } from '@/types';
import { getCollegeColorPalette } from '@/lib/collegeColors';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';

// Lazy load RichTextEditor - TipTap is a heavy dependency
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <div className="text-[var(--text-muted)]" style={{ padding: '12px 16px', minHeight: '50px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--panel-2)' }}>Loading editor...</div>,
  ssr: false,
});
import FolderTree from '@/components/notes/FolderTree';
import TagInput from '@/components/notes/TagInput';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import { Plus, Trash2, Edit2, Pin, Folder as FolderIcon, Link as LinkIcon, ChevronDown, Crown, Save, CheckSquare, FileText, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import { FREE_TIER_LIMITS } from '@/lib/subscription';
import Link from 'next/link';
import NaturalLanguageInput from '@/components/NaturalLanguageInput';
import { parseNaturalLanguage, NLP_PLACEHOLDERS } from '@/lib/naturalLanguageParser';

export default function NotesPage() {
  const isMobile = useIsMobile();
  const subscription = useSubscription();
  const searchParams = useSearchParams();
  const university = useAppStore((state) => state.settings.university);
  const theme = useAppStore((state) => state.settings.theme) || 'dark';
  const colorPalette = getCollegeColorPalette(university || null, theme);
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showFoldersDropdown, setShowFoldersDropdown] = useState(true);
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [detailViewContent, setDetailViewContent] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: { type: 'doc', content: [] },
    folderId: '',
    courseId: '',
    taskId: '',
    deadlineId: '',
    examId: '',
    recurringTaskPatternId: '',
    recurringDeadlinePatternId: '',
    recurringExamPatternId: '',
    tags: [] as string[],
    links: [{ label: '', url: '' }],
  });
  const [nlpInput, setNlpInput] = useState('');

  const { courses, notes, folders, tasks, deadlines, exams, settings, addNote, updateNote, deleteNote, toggleNotePin, initializeStore, updateSettings } = useAppStore();

  useEffect(() => {
    initializeStore();
    setMounted(true);
  }, [initializeStore]);

  // Check for noteId in URL params to open a specific note
  useEffect(() => {
    const noteId = searchParams.get('note');
    if (noteId && mounted && notes.length > 0) {
      const noteExists = notes.some((n) => n.id === noteId);
      if (noteExists) {
        setSelectedNoteId(noteId);
      }
    }
  }, [searchParams, mounted, notes]);

  // Sync detail view content when selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note) {
        setDetailViewContent(note.content || { type: 'doc', content: [] });
        setHasUnsavedChanges(false);
      }
    }
  }, [selectedNoteId, notes]);

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
        taskId: formData.taskId || null,
        deadlineId: formData.deadlineId || null,
        examId: formData.examId || null,
        recurringTaskPatternId: formData.recurringTaskPatternId || null,
        recurringDeadlinePatternId: formData.recurringDeadlinePatternId || null,
        recurringExamPatternId: formData.recurringExamPatternId || null,
        tags: formData.tags,
        links,
      });
      setEditingId(null);
      setSelectedNoteId(null);
    } else {
      try {
        await addNote({
          title: formData.title,
          content: formData.content,
          folderId: formData.folderId || null,
          courseId: formData.courseId || null,
          taskId: formData.taskId || null,
          deadlineId: formData.deadlineId || null,
          examId: formData.examId || null,
          recurringTaskPatternId: formData.recurringTaskPatternId || null,
          recurringDeadlinePatternId: formData.recurringDeadlinePatternId || null,
          recurringExamPatternId: formData.recurringExamPatternId || null,
          tags: formData.tags,
          isPinned: false,
          links,
        });
      } catch (error: any) {
        if (error.code === 'LIMIT_REACHED' || error.upgradeRequired) {
          setShowUpgradeModal(true);
          return;
        }
        throw error;
      }
    }

    resetForm();
    setShowForm(false);
  };

  const startEdit = (note: Note) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedNoteId(note.id);
    setEditingId(note.id);
    setFormData({
      title: note.title,
      content: note.content || { type: 'doc', content: [] },
      folderId: note.folderId || '',
      courseId: note.courseId || '',
      taskId: note.taskId || '',
      deadlineId: note.deadlineId || '',
      examId: note.examId || '',
      recurringTaskPatternId: note.recurringTaskPatternId || '',
      recurringDeadlinePatternId: note.recurringDeadlinePatternId || '',
      recurringExamPatternId: note.recurringExamPatternId || '',
      tags: note.tags || [],
      links: note.links && note.links.length > 0 ? note.links : [{ label: '', url: '' }],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setNlpInput('');
    setFormData({
      title: '',
      content: { type: 'doc', content: [] },
      folderId: '',
      courseId: '',
      taskId: '',
      deadlineId: '',
      examId: '',
      recurringTaskPatternId: '',
      recurringDeadlinePatternId: '',
      recurringExamPatternId: '',
      tags: [],
      links: [{ label: '', url: '' }],
    });
  };

  // Handle NLP input change
  const handleNlpInputChange = (value: string) => {
    setNlpInput(value);

    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        title: '',
        courseId: '',
        folderId: '',
      }));
      return;
    }

    const parsed = parseNaturalLanguage(value, { courses, folders, itemType: 'note' });

    setFormData(prev => ({
      ...prev,
      title: parsed.title || '',
      courseId: parsed.courseId || '',
      folderId: parsed.folderId || '',
    }));
  };

  // Check limit before opening new note form
  const handleNewNote = () => {
    // If premium or trialing, always allow
    if (subscription.isPremium) {
      resetForm();
      setShowForm(true);
      return;
    }

    // Check if at limit
    if (notes.length >= FREE_TIER_LIMITS.maxNotes) {
      setShowUpgradeModal(true);
      return;
    }

    resetForm();
    setShowForm(true);
  };

  const handleFiltersCollapseChange = (isOpen: boolean) => {
    const currentCollapsed = settings.dashboardCardsCollapsedState || [];
    const newState = isOpen
      ? currentCollapsed.filter((id) => id !== 'notes-filters')
      : [...currentCollapsed, 'notes-filters'];
    updateSettings({ dashboardCardsCollapsedState: newState });
  };

  const handleDeleteNote = async (id: string) => {
    setDeleteConfirmNote(id);
  };

  // Save content changes from detail view
  const saveDetailViewContent = async () => {
    if (!selectedNoteId || !hasUnsavedChanges) return;
    await updateNote(selectedNoteId, { content: detailViewContent });
    setHasUnsavedChanges(false);
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

  // Get courses that have notes associated with them
  const coursesWithNotes = courses.filter((course) =>
    notes.some((note) => note.courseId === course.id)
  );

  // Filter and search notes
  const filtered = notes
    .filter((note) => {
      if (selectedFolder && note.folderId !== selectedFolder) return false;
      if (selectedCourse && note.courseId !== selectedCourse) return false;
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
  const deleteButtonBgColor = isLightMode ? 'var(--danger)' : '#660000';
  const deleteButtonTextColor = 'white';
  const deleteButtonGlow = isLightMode ? '0 0 10px rgba(229, 83, 75, 0.4)' : '0 0 10px rgba(102, 0, 0, 0.6)';

  return (
    <>
      {/* Notes Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1
              style={{
                fontSize: isMobile ? '26px' : '34px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Notes
            </h1>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
              Your study notes and resources.
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            style={{ marginTop: isMobile ? '12px' : '8px' }}
            onClick={() => {
              if (showForm) {
                setShowForm(false);
              } else {
                handleNewNote();
              }
            }}
          >
            <Plus size={18} />
            {isMobile ? 'Note' : 'New Note'}
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-12 gap-[var(--grid-gap)]" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
          {/* Sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3" style={{ height: 'fit-content', display: isMobile ? 'none' : 'block', position: 'sticky', top: '24px', alignSelf: 'start' }}>
            <Card noAccent>
              <div style={{ marginBottom: '14px' }}>
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

              {/* Course filter dropdown */}
              {coursesWithNotes.length > 0 && (
                <div style={{ marginTop: '14px', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setShowCoursesDropdown(!showCoursesDropdown)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Courses</span>
                    <ChevronDown size={16} style={{ transform: showCoursesDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
                  </button>
                  {showCoursesDropdown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '0px' }}>
                      <label
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: selectedCourse === null ? 'var(--text)' : 'var(--text-muted)', backgroundColor: selectedCourse === null ? 'rgba(255,255,255,0.05)' : 'transparent', minWidth: 0 }}
                        onClick={() => setSelectedCourse(null)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCourse === null ? 'rgba(255,255,255,0.05)' : 'transparent'; e.currentTarget.style.color = selectedCourse === null ? 'var(--text)' : 'var(--text-muted)'; }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>All Courses</span>
                      </label>
                      {coursesWithNotes.map((course) => (
                        <label
                          key={course.id}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', padding: '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: selectedCourse === course.id ? 'var(--text)' : 'var(--text-muted)', backgroundColor: selectedCourse === course.id ? 'rgba(255,255,255,0.05)' : 'transparent', minWidth: 0 }}
                          onClick={() => setSelectedCourse(course.id)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCourse === course.id ? 'rgba(255,255,255,0.05)' : 'transparent'; e.currentTarget.style.color = selectedCourse === course.id ? 'var(--text)' : 'var(--text-muted)'; }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{course.code}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tag filter dropdown */}
              {allTags.length > 0 && (
                <div style={{ marginTop: '14px', position: 'relative' }}>
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

          {/* Mobile collapsible filters */}
          {isMobile && (
            <div className="col-span-12" style={{ marginBottom: isMobile ? '8px' : '0px' }}>
              <CollapsibleCard
                id="notes-filters"
                title="Filters"
                initialOpen={!(settings.dashboardCardsCollapsedState || []).includes('notes-filters')}
                onChange={handleFiltersCollapseChange}
              >
                <div style={{ marginBottom: isMobile ? '12px' : '14px' }}>
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
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '4px 8px' : '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <span style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: '600', color: 'var(--text)' }}>Folders</span>
                    <ChevronDown size={isMobile ? 12 : 16} style={{ transform: showFoldersDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
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

                {/* Course filter dropdown */}
                {coursesWithNotes.length > 0 && (
                  <div style={{ marginTop: isMobile ? '12px' : '14px', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowCoursesDropdown(!showCoursesDropdown)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '4px 8px' : '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <span style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: '600', color: 'var(--text)' }}>Courses</span>
                      <ChevronDown size={isMobile ? 12 : 16} style={{ transform: showCoursesDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
                    </button>
                    {showCoursesDropdown && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '0px' }}>
                        <label
                          style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '11px' : '14px', cursor: 'pointer', padding: isMobile ? '4px 6px' : '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: selectedCourse === null ? 'var(--text)' : 'var(--text-muted)', backgroundColor: selectedCourse === null ? 'rgba(255,255,255,0.05)' : 'transparent', minWidth: 0 }}
                          onClick={() => setSelectedCourse(null)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCourse === null ? 'rgba(255,255,255,0.05)' : 'transparent'; e.currentTarget.style.color = selectedCourse === null ? 'var(--text)' : 'var(--text-muted)'; }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>All Courses</span>
                        </label>
                        {coursesWithNotes.map((course) => (
                          <label
                            key={course.id}
                            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '11px' : '14px', cursor: 'pointer', padding: isMobile ? '4px 6px' : '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: selectedCourse === course.id ? 'var(--text)' : 'var(--text-muted)', backgroundColor: selectedCourse === course.id ? 'rgba(255,255,255,0.05)' : 'transparent', minWidth: 0 }}
                            onClick={() => setSelectedCourse(course.id)}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCourse === course.id ? 'rgba(255,255,255,0.05)' : 'transparent'; e.currentTarget.style.color = selectedCourse === course.id ? 'var(--text)' : 'var(--text-muted)'; }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{course.code}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tag filter dropdown */}
                {allTags.length > 0 && (
                  <div style={{ marginTop: isMobile ? '12px' : '14px', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '4px 8px' : '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <span style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: '600', color: 'var(--text)' }}>Tags</span>
                      <ChevronDown size={isMobile ? 12 : 16} style={{ transform: showTagsDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease', color: 'var(--text)' }} />
                    </button>
                    {showTagsDropdown && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', marginTop: '0px' }}>
                        {allTags.map((tag) => (
                          <label key={tag} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', fontSize: isMobile ? '11px' : '14px', cursor: 'pointer', padding: isMobile ? '4px 6px' : '8px', borderRadius: '6px', transition: 'background-color 150ms ease, color 150ms ease', color: 'var(--text-muted)', minWidth: 0 }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
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
              </CollapsibleCard>
            </div>
          )}

          {/* Main content - 9 columns */}
          <div className="col-span-12 lg:col-span-9" style={{ overflow: 'visible', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', zIndex: 1 }}>
            {/* Form */}
            {showForm && (
              <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <Card>
                  <form onSubmit={handleSubmit} className={isMobile ? 'space-y-2' : 'space-y-5'}>
                  {/* Natural Language Input - only for new notes (premium feature) */}
                  {!editingId && subscription.isPremium && (
                    <NaturalLanguageInput
                      value={nlpInput}
                      onChange={handleNlpInputChange}
                      placeholder={NLP_PLACEHOLDERS.note}
                      autoFocus
                    />
                  )}
                  <Input
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Note title"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2 lg:gap-4" style={{ marginTop: isMobile ? '4px' : '16px' }}>
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

                  {/* Link to Task, Assignment, or Exam */}
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'}`} style={{ marginTop: isMobile ? '8px' : '16px' }}>
                    <Select
                      label="Link to Task"
                      value={formData.recurringTaskPatternId ? `pattern:${formData.recurringTaskPatternId}` : (formData.taskId ? `task:${formData.taskId}` : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormData({ ...formData, taskId: '', recurringTaskPatternId: '' });
                        } else if (val.startsWith('pattern:')) {
                          setFormData({ ...formData, taskId: '', recurringTaskPatternId: val.replace('pattern:', '') });
                        } else if (val.startsWith('task:')) {
                          setFormData({ ...formData, taskId: val.replace('task:', ''), recurringTaskPatternId: '' });
                        }
                      }}
                      options={[
                        { value: '', label: 'No Task' },
                        ...(() => {
                          // Get non-recurring tasks
                          const nonRecurring = tasks
                            .filter((t) => t.status === 'open' && !t.recurringPatternId)
                            .map((t) => ({ value: `task:${t.id}`, label: t.title }));
                          // Get one task per recurring pattern (earliest open instance)
                          const patternMap = new Map<string, { title: string; dueAt: string | null }>();
                          tasks
                            .filter((t) => t.status === 'open' && t.recurringPatternId)
                            .forEach((t) => {
                              const existing = patternMap.get(t.recurringPatternId!);
                              if (!existing || (t.dueAt && existing.dueAt && new Date(t.dueAt) < new Date(existing.dueAt))) {
                                patternMap.set(t.recurringPatternId!, { title: t.title, dueAt: t.dueAt });
                              }
                            });
                          const recurring = Array.from(patternMap.entries()).map(([patternId, { title }]) => ({
                            value: `pattern:${patternId}`,
                            label: `${title} (recurring)`,
                          }));
                          return [...nonRecurring, ...recurring];
                        })(),
                      ]}
                    />
                    <Select
                      label="Link to Assignment"
                      value={formData.recurringDeadlinePatternId ? `pattern:${formData.recurringDeadlinePatternId}` : (formData.deadlineId ? `deadline:${formData.deadlineId}` : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormData({ ...formData, deadlineId: '', recurringDeadlinePatternId: '' });
                        } else if (val.startsWith('pattern:')) {
                          setFormData({ ...formData, deadlineId: '', recurringDeadlinePatternId: val.replace('pattern:', '') });
                        } else if (val.startsWith('deadline:')) {
                          setFormData({ ...formData, deadlineId: val.replace('deadline:', ''), recurringDeadlinePatternId: '' });
                        }
                      }}
                      options={[
                        { value: '', label: 'No Assignment' },
                        ...(() => {
                          // Get non-recurring deadlines
                          const nonRecurring = deadlines
                            .filter((d) => d.status === 'open' && !d.recurringPatternId)
                            .map((d) => ({ value: `deadline:${d.id}`, label: d.title }));
                          // Get one deadline per recurring pattern (earliest open instance)
                          const patternMap = new Map<string, { title: string; dueAt: string | null }>();
                          deadlines
                            .filter((d) => d.status === 'open' && d.recurringPatternId)
                            .forEach((d) => {
                              const existing = patternMap.get(d.recurringPatternId!);
                              if (!existing || (d.dueAt && existing.dueAt && new Date(d.dueAt) < new Date(existing.dueAt))) {
                                patternMap.set(d.recurringPatternId!, { title: d.title, dueAt: d.dueAt });
                              }
                            });
                          const recurring = Array.from(patternMap.entries()).map(([patternId, { title }]) => ({
                            value: `pattern:${patternId}`,
                            label: `${title} (recurring)`,
                          }));
                          return [...nonRecurring, ...recurring];
                        })(),
                      ]}
                    />
                    <Select
                      label="Link to Exam"
                      value={formData.recurringExamPatternId ? `pattern:${formData.recurringExamPatternId}` : (formData.examId ? `exam:${formData.examId}` : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormData({ ...formData, examId: '', recurringExamPatternId: '' });
                        } else if (val.startsWith('pattern:')) {
                          setFormData({ ...formData, examId: '', recurringExamPatternId: val.replace('pattern:', '') });
                        } else if (val.startsWith('exam:')) {
                          setFormData({ ...formData, examId: val.replace('exam:', ''), recurringExamPatternId: '' });
                        }
                      }}
                      options={[
                        { value: '', label: 'No Exam' },
                        ...(() => {
                          // Get non-recurring exams
                          const nonRecurring = exams
                            .filter((e) => e.status === 'scheduled' && !e.recurringPatternId)
                            .map((e) => ({ value: `exam:${e.id}`, label: e.title }));
                          // Get one exam per recurring pattern (earliest scheduled instance)
                          const patternMap = new Map<string, { title: string; examAt: string | null }>();
                          exams
                            .filter((e) => e.status === 'scheduled' && e.recurringPatternId)
                            .forEach((e) => {
                              const existing = patternMap.get(e.recurringPatternId!);
                              if (!existing || (e.examAt && existing.examAt && new Date(e.examAt) < new Date(existing.examAt))) {
                                patternMap.set(e.recurringPatternId!, { title: e.title, examAt: e.examAt });
                              }
                            });
                          const recurring = Array.from(patternMap.entries()).map(([patternId, { title }]) => ({
                            value: `pattern:${patternId}`,
                            label: `${title} (recurring)`,
                          }));
                          return [...nonRecurring, ...recurring];
                        })(),
                      ]}
                    />
                  </div>

                  <div style={{ marginTop: isMobile ? '8px' : '16px' }}>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                    />
                  </div>

                  {/* Tags input with suggestions */}
                  <div style={{ marginTop: isMobile ? '4px' : '-6px' }}>
                    <label className={isMobile ? 'block text-xs font-medium text-[var(--text)]' : 'block text-sm font-medium text-[var(--text)]'} style={{ marginBottom: isMobile ? '4px' : '12px' }}>Tags</label>
                    <TagInput
                      tags={formData.tags}
                      onTagsChange={(tags) => setFormData({ ...formData, tags })}
                      allAvailableTags={allTags}
                      placeholder="Add tag..."
                    />
                  </div>

                  <div className={isMobile ? 'flex gap-2' : 'flex gap-3'} style={{ paddingTop: isMobile ? '8px' : '12px' }}>
                    <Button variant="primary" type="submit" size={isMobile ? 'sm' : 'md'}>
                      {editingId ? 'Save Changes' : 'Create Note'}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      size={isMobile ? 'sm' : 'md'}
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
              <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <Card>
                  {/* Header with title and actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{selectedNote.title}</h2>
                        {selectedNote.isPinned && (
                          <Pin size={isMobile ? 16 : 20} style={{ color: 'var(--accent)' }} />
                        )}
                      </div>
                      {(selectedNote.courseId || selectedNote.folderId) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: isMobile ? '12px' : '14px', color: 'var(--text-muted)' }}>
                          {selectedNote.courseId && (
                            <span>{courses.find((c) => c.id === selectedNote.courseId)?.code}</span>
                          )}
                          {selectedNote.folderId && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FolderIcon size={isMobile ? 12 : 14} />
                              {folders.find((f) => f.id === selectedNote.folderId)?.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                        {!isMobile && 'Edit'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteNote(selectedNote.id)}
                      >
                        <Trash2 size={16} />
                        {!isMobile && 'Delete'}
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
                      {selectedNote.tags.map((tag) => (
                        <span key={tag} style={{ backgroundColor: 'var(--accent)', color: 'white', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Linked Items */}
                  {(selectedNote.task || selectedNote.deadline || selectedNote.exam || selectedNote.recurringTaskPattern || selectedNote.recurringDeadlinePattern || selectedNote.recurringExamPattern) && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--panel-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Linked To</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(selectedNote.task || selectedNote.recurringTaskPattern) && (
                          <Link
                            href={`/tasks?task=${selectedNote.taskId || ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--link)', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <CheckSquare size={16} />
                            <span>
                              {selectedNote.task?.title || (selectedNote.recurringTaskPattern?.taskTemplate as any)?.title || 'Task'}
                              {selectedNote.recurringTaskPattern && ' (recurring)'}
                            </span>
                          </Link>
                        )}
                        {(selectedNote.deadline || selectedNote.recurringDeadlinePattern) && (
                          <Link
                            href={`/deadlines?deadline=${selectedNote.deadlineId || ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--link)', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <Clock size={16} />
                            <span>
                              {selectedNote.deadline?.title || (selectedNote.recurringDeadlinePattern?.deadlineTemplate as any)?.title || 'Assignment'}
                              {selectedNote.recurringDeadlinePattern && ' (recurring)'}
                            </span>
                          </Link>
                        )}
                        {(selectedNote.exam || selectedNote.recurringExamPattern) && (
                          <Link
                            href={`/exams?exam=${selectedNote.examId || ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--link)', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            <FileText size={16} />
                            <span>
                              {selectedNote.exam?.title || (selectedNote.recurringExamPattern?.examTemplate as any)?.title || 'Exam'}
                              {selectedNote.recurringExamPattern && ' (recurring)'}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ marginTop: '16px' }}>
                    {hasUnsavedChanges && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={saveDetailViewContent}
                        >
                          <Save size={14} />
                          Save Changes
                        </Button>
                      </div>
                    )}
                    <RichTextEditor
                      key={selectedNoteId}
                      value={detailViewContent || selectedNote?.content || { type: 'doc', content: [] }}
                      onChange={(content) => {
                        setDetailViewContent(content);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>

                  {/* Links */}
                  {selectedNote.links && selectedNote.links.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={16} />
                        Links
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedNote.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Last updated {new Date(selectedNote.updatedAt).toLocaleDateString()}
                    </span>
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
                  <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                    <h4 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'var(--text)', marginBottom: isMobile ? '8px' : '12px', marginTop: 0 }}>Pinned Notes</h4>
                    <Card>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {pinnedNotes.map((note, index) => {
                          const course = courses.find((c) => c.id === note.courseId);
                          const folder = folders.find((f) => f.id === note.folderId);

                          return (
                            <div
                              key={note.id}
                              onClick={() => setSelectedNoteId(note.id)}
                              style={{ padding: isMobile ? '8px 12px' : '12px 32px', borderBottom: index < pinnedNotes.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 150ms ease', cursor: 'pointer' }}
                              onMouseEnter={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                                  const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                  if (buttonsDiv) buttonsDiv.style.opacity = '1';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                  if (buttonsDiv) buttonsDiv.style.opacity = '0';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '8px' : '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h3 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{note.title}</h3>
                                  {note.plainText && (
                                    <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', marginTop: isMobile ? '2px' : '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                      {note.plainText}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? '4px' : '6px', marginTop: isMobile ? '4px' : '4px' }}>
                                    {course && <span style={{ fontSize: isMobile ? '10px' : '12px', backgroundColor: 'var(--nav-active)', padding: isMobile ? '2px 4px' : '4px 8px', borderRadius: '4px' }}>{course.code}</span>}
                                    {folder && selectedFolder !== note.folderId && (
                                      <span style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <FolderIcon size={isMobile ? 10 : 12} />
                                        {folder.name}
                                      </span>
                                    )}
                                    {note.tags && note.tags.length > 0 && (
                                      <div style={{ display: 'flex', gap: '2px' }}>
                                        {note.tags.slice(0, 2).map((tag) => {
                                          const hasCollege = settings?.university;
                                          const isLightMode = settings?.theme === 'light';
                                          const tagColor = hasCollege
                                            ? (isLightMode ? 'var(--accent)' : 'var(--calendar-current-date-color)')
                                            : 'var(--link)';
                                          return (
                                            <span key={tag} style={{ fontSize: isMobile ? '10px' : '12px', color: tagColor }}>
                                              #{tag}
                                            </span>
                                          );
                                        })}
                                        {note.tags.length > 2 && (
                                          <span style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)' }}>
                                            +{note.tags.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div data-buttons-container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '2px', opacity: isMobile ? 1 : 0, transition: 'opacity 150ms ease', marginLeft: isMobile ? '0' : 'auto' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotePin(note.id);
                                    }}
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--link)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                    title="Unpin note"
                                  >
                                    <Pin size={isMobile ? 16 : 20} style={{ fill: 'currentColor' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(note);
                                    }}
                                    className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Edit2 size={isMobile ? 16 : 20} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f85149'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Trash2 size={isMobile ? 16 : 20} />
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
                  <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                    {pinnedNotes.length > 0 && (
                      <h4 style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: 'var(--text)', marginBottom: isMobile ? '8px' : '12px', marginTop: 0 }}>All Notes</h4>
                    )}
                    <Card>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {unpinnedNotes.map((note, index) => {
                          const course = courses.find((c) => c.id === note.courseId);
                          const folder = folders.find((f) => f.id === note.folderId);

                          return (
                            <div
                              key={note.id}
                              onClick={() => setSelectedNoteId(note.id)}
                              style={{ padding: isMobile ? '8px 12px' : '12px 32px', borderBottom: index < unpinnedNotes.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background-color 150ms ease', cursor: 'pointer' }}
                              onMouseEnter={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.backgroundColor = 'var(--panel-2)';
                                  const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                  if (buttonsDiv) buttonsDiv.style.opacity = '1';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isMobile) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  const buttonsDiv = e.currentTarget.querySelector('[data-buttons-container]') as HTMLElement;
                                  if (buttonsDiv) buttonsDiv.style.opacity = '0';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? '8px' : '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <h3 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{note.title}</h3>
                                  {note.plainText && (
                                    <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'var(--text-muted)', marginTop: isMobile ? '2px' : '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                      {note.plainText}
                                    </p>
                                  )}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? '4px' : '6px', marginTop: isMobile ? '4px' : '4px' }}>
                                    {course && <span style={{ fontSize: isMobile ? '10px' : '12px', backgroundColor: 'var(--nav-active)', padding: isMobile ? '2px 4px' : '4px 8px', borderRadius: '4px' }}>{course.code}</span>}
                                    {folder && selectedFolder !== note.folderId && (
                                      <span style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        <FolderIcon size={isMobile ? 10 : 12} />
                                        {folder.name}
                                      </span>
                                    )}
                                    {note.tags && note.tags.length > 0 && (
                                      <div style={{ display: 'flex', gap: '2px' }}>
                                        {note.tags.slice(0, 2).map((tag) => {
                                          const hasCollege = settings?.university;
                                          const isLightMode = settings?.theme === 'light';
                                          const tagColor = hasCollege
                                            ? (isLightMode ? 'var(--accent)' : 'var(--calendar-current-date-color)')
                                            : 'var(--link)';
                                          return (
                                            <span key={tag} style={{ fontSize: isMobile ? '10px' : '12px', color: tagColor }}>
                                              #{tag}
                                            </span>
                                          );
                                        })}
                                        {note.tags.length > 2 && (
                                          <span style={{ fontSize: isMobile ? '10px' : '12px', color: 'var(--text-muted)' }}>
                                            +{note.tags.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div data-buttons-container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '4px' : '2px', opacity: isMobile ? 1 : 0, transition: 'opacity 150ms ease', marginLeft: isMobile ? '0' : 'auto' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNotePin(note.id);
                                    }}
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--link)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                    title="Pin note"
                                  >
                                    <Pin size={isMobile ? 16 : 20} style={{ fill: 'none' }} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(note);
                                    }}
                                    className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--edit-hover)] hover:bg-white/5 transition-colors"
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Edit2 size={isMobile ? 16 : 20} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    style={{ padding: isMobile ? '4px' : '8px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#f85149'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                                  >
                                    <Trash2 size={isMobile ? 16 : 20} />
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
                action={{ label: 'Create Note', onClick: handleNewNote }}
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
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setDeleteConfirmNote(null)}
          >
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: isMobile ? '12px 12px 0 0' : '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                maxWidth: isMobile ? '100%' : '400px',
                width: isMobile ? '100%' : '100%',
                margin: isMobile ? 0 : '0 16px',
                padding: isMobile ? '16px' : '24px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: 'var(--text)', margin: '0 0 8px 0' }}>
                Delete note?
              </h3>
              <p style={{ fontSize: isMobile ? '12px' : '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                This will permanently delete this note. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px' }}>
                <button
                  onClick={() => setDeleteConfirmNote(null)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px 12px' : '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: isMobile ? '13px' : '14px',
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.03)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteNote}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px 12px' : '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: isMobile ? '13px' : '14px',
                    border: 'none',
                    backgroundColor: deleteButtonBgColor,
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                    boxShadow: deleteButtonGlow,
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

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--panel)',
                borderRadius: isMobile ? '12px 12px 0 0' : '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxWidth: isMobile ? '100%' : '420px',
                width: isMobile ? '100%' : '100%',
                margin: isMobile ? 0 : '0 16px',
                padding: isMobile ? '24px 20px' : '28px',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colorPalette.accent}30 0%, ${colorPalette.accent}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Crown size={28} style={{ color: 'var(--text)' }} />
              </div>
              <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: 'var(--text)', margin: '0 0 8px 0' }}>
                Note Limit Reached
              </h3>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                You&apos;ve reached the free tier limit. Upgrade to Premium for unlimited notes and more features.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/pricing" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '12px 16px' : '12px 20px',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: isMobile ? '14px' : '15px',
                      border: '1px solid var(--border)',
                      backgroundColor: colorPalette.accent,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Crown size={18} />
                    Upgrade to Premium
                  </button>
                </Link>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '10px 16px' : '10px 20px',
                    borderRadius: '10px',
                    fontWeight: '500',
                    fontSize: isMobile ? '13px' : '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255,255,255,0.03)',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
}
