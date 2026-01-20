'use client';

import { useState, useEffect, useRef } from 'react';
import useAppStore from '@/lib/store';
import { showDeleteToast } from '@/components/ui/DeleteToast';
import { getQuickLinks } from '@/lib/quickLinks';
import { TOOLS_CARDS, DEFAULT_VISIBLE_TOOLS_CARDS } from '@/lib/customizationConstants';
import CollapsibleCard from '@/components/ui/CollapsibleCard';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import PomodoroTimer from '@/components/tools/PomodoroTimer';
import GradeTracker from '@/components/tools/GradeTracker';
import WhatIfProjector from '@/components/tools/WhatIfProjector';
import GpaTrendChart from '@/components/tools/GpaTrendChart';
import { Plus, Trash2, X, Pencil, Lock, Crown } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { useFormatters } from '@/hooks/useFormatters';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CustomQuickLink {
  id: string;
  label: string;
  url: string;
  university: string;
}

interface GpaEntry {
  id: string;
  courseId: string | null;
  courseName: string;
  grade: string;
  credits: number;
  term?: string | null;
  createdAt: string;
}

interface FormCourse {
  id?: string;
  courseName: string;
  gradeType: 'letter' | 'percentage';
  grade: string;
  credits: string;
}

export default function ToolsPage() {
  const isMobile = useIsMobile();
  const { settings, updateSettings } = useAppStore();
  const subscription = useSubscription();
  const { getCourseDisplayName } = useFormatters();
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formCourses, setFormCourses] = useState<FormCourse[]>([
    { courseName: '', gradeType: 'letter', grade: 'A', credits: '3' },
  ]);
  const [gpaResult, setGpaResult] = useState<number | null>(null);
  const [gpaEntries, setGpaEntries] = useState<GpaEntry[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomQuickLink[]>([]);
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [addLinkError, setAddLinkError] = useState('');
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [pendingLinkRemove, setPendingLinkRemove] = useState<{ type: 'custom' | 'default'; id?: string; university?: string; label?: string } | null>(null);
  const pendingLinkTimeout = useRef<NodeJS.Timeout | null>(null);
  const confirmBeforeDelete = settings.confirmBeforeDelete ?? true;

  // Tools card visibility is only customizable for premium users - free users see defaults
  const savedVisibleToolsCards = settings.visibleToolsCards || DEFAULT_VISIBLE_TOOLS_CARDS;
  const visibleToolsCards = subscription.isPremium ? savedVisibleToolsCards : DEFAULT_VISIBLE_TOOLS_CARDS;

  // Get the tools cards order from settings, or use the default (only applies to premium users)
  const savedToolsCardsOrder = settings.toolsCardsOrder
    ? (typeof settings.toolsCardsOrder === 'string'
        ? JSON.parse(settings.toolsCardsOrder)
        : settings.toolsCardsOrder)
    : Object.values(TOOLS_CARDS);
  const toolsCardsOrder = subscription.isPremium ? savedToolsCardsOrder : Object.values(TOOLS_CARDS);

  const gradePoints: { [key: string]: number } = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0,
  };

  // Function to refresh GPA entries from the database
  const refreshGpaEntries = async () => {
    try {
      const res = await fetch('/api/gpa-entries');
      if (res.ok) {
        const { entries: fetchedEntries } = await res.json();
        setGpaEntries(fetchedEntries);
      }
    } catch (error) {
      console.error('Error refreshing GPA entries:', error);
    }
  };

  // Fetch courses and load saved GPA entries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, entriesRes, linksRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/gpa-entries'),
          fetch('/api/custom-quick-links'),
        ]);

        if (coursesRes.ok) {
          const { courses: fetchedCourses } = await coursesRes.json();
          setCourses(fetchedCourses);
        }

        if (entriesRes.ok) {
          const { entries: fetchedEntries } = await entriesRes.json();
          // Store all entries for components to use
          setGpaEntries(fetchedEntries);

          // Filter to only entries without a term (GPA Calculator entries)
          const calculatorEntries = fetchedEntries.filter((e: GpaEntry) => !e.term || (typeof e.term === 'string' && e.term.trim() === ''));
          if (calculatorEntries.length > 0) {
            // Convert saved entries to form courses
            const savedCourses = calculatorEntries.map((entry: GpaEntry) => ({
              id: entry.id,
              courseName: entry.courseName,
              gradeType: entry.grade.includes('.') || !Object.keys({ 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 }).includes(entry.grade) ? 'percentage' : 'letter',
              grade: entry.grade,
              credits: entry.credits.toString(),
            }));
            setFormCourses(savedCourses);
          }
        }

        if (linksRes.ok) {
          const { links: fetchedLinks } = await linksRes.json();
          setCustomLinks(fetchedLinks);
          localStorage.setItem('customQuickLinks', JSON.stringify(fetchedLinks));
        }

        setMounted(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMounted(true);
      }
    };

    fetchData();
  }, []);

  const getGradePoints = (grade: string, gradeType: 'letter' | 'percentage'): number => {
    if (gradeType === 'percentage') {
      const percentage = parseFloat(grade);
      if (isNaN(percentage)) return 0;
      // Convert percentage to GPA scale (0-4.0)
      if (percentage >= 93) return 4.0;
      if (percentage >= 90) return 3.7;
      if (percentage >= 87) return 3.3;
      if (percentage >= 83) return 3.0;
      if (percentage >= 80) return 2.7;
      if (percentage >= 77) return 2.3;
      if (percentage >= 73) return 2.0;
      if (percentage >= 70) return 1.7;
      if (percentage >= 67) return 1.3;
      if (percentage >= 63) return 1.0;
      return 0;
    }
    return gradePoints[grade] || 0;
  };

  const calculateGPA = async () => {
    // First, save/update all form courses to database
    const updatedCourses = [...formCourses];
    console.log('[calculateGPA] Starting with courses:', updatedCourses);

    for (let i = 0; i < updatedCourses.length; i++) {
      const course = updatedCourses[i];
      console.log(`[calculateGPA] Processing course ${i}:`, course);
      if (!course.courseName || !course.credits) {
        console.log(`[calculateGPA] Skipping course ${i} - missing courseName or credits`);
        continue;
      }

      const selectedCourse = courses.find((c) => c.name === course.courseName);

      if (course.id) {
        // Already saved, update it
        try {
          await fetch(`/api/gpa-entries/${course.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseName: course.courseName,
              grade: course.grade,
              credits: course.credits,
            }),
          });
        } catch (error) {
          console.error('Error updating GPA entry:', error);
        }
      } else {
        // New course, save it
        try {
          const res = await fetch('/api/gpa-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: selectedCourse?.id || null,
              courseName: course.courseName,
              grade: course.grade,
              credits: course.credits,
            }),
          });

          if (res.ok) {
            const { entry } = await res.json();
            updatedCourses[i] = { ...course, id: entry.id };
          }
        } catch (error) {
          console.error('Error saving GPA entry:', error);
        }
      }
    }

    setFormCourses(updatedCourses);

    // Reload GPA entries from database to ensure they're persisted
    try {
      const entriesRes = await fetch('/api/gpa-entries');
      if (entriesRes.ok) {
        const { entries: fetchedEntries } = await entriesRes.json();
        // Filter to only entries without a term (GPA Calculator entries)
        const calculatorEntries = fetchedEntries.filter((e: GpaEntry) => !e.term || e.term.trim() === '');
        if (calculatorEntries.length > 0) {
          const savedCourses = calculatorEntries.map((entry: GpaEntry) => ({
            id: entry.id,
            courseName: entry.courseName,
            gradeType: entry.grade.includes('.') || !Object.keys({ 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 }).includes(entry.grade) ? 'percentage' : 'letter',
            grade: entry.grade,
            credits: entry.credits.toString(),
          }));
          setFormCourses(savedCourses);
        }
      }
    } catch (error) {
      console.error('Error reloading GPA entries:', error);
    }

    // Calculate GPA
    let totalPoints = 0;
    let totalCredits = 0;

    updatedCourses.forEach((course) => {
      const points = getGradePoints(course.grade, course.gradeType);
      const credits = parseFloat(course.credits) || 0;
      totalPoints += points * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    setGpaResult(Math.round(gpa * 100) / 100);
  };

  const addCourse = () => {
    setFormCourses([
      ...formCourses,
      { courseName: '', gradeType: 'letter', grade: 'A', credits: '3' },
    ]);
  };

  const removeCourse = (index: number) => {
    if (index === 0) {
      // Clear the first row instead of removing it
      const course = formCourses[index];
      setFormCourses((prev) => {
        const newCourses = [...prev];
        newCourses[0] = { courseName: '', gradeType: 'letter', grade: 'A', credits: '3' };
        return newCourses;
      });
      // Delete from database if it's saved
      if (course?.id) {
        fetch(`/api/gpa-entries/${course.id}`, {
          method: 'DELETE',
        }).catch((error) => {
          console.error('Error deleting GPA entry:', error);
        });
      }
    } else {
      const course = formCourses[index];
      setFormCourses((prev) => prev.filter((_, i) => i !== index));
      // If it's a saved course (has an ID), delete from database
      if (course?.id) {
        fetch(`/api/gpa-entries/${course.id}`, {
          method: 'DELETE',
        }).catch((error) => {
          console.error('Error deleting GPA entry:', error);
        });
      }
    }
  };

  const updateCourse = (index: number, field: keyof FormCourse, value: string) => {
    const newCourses = [...formCourses];
    newCourses[index] = { ...newCourses[index], [field]: value };
    setFormCourses(newCourses);
  };

  // Custom Quick Links functions
  const addCustomLink = async () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      setAddLinkError('Please enter both a label and URL');
      return;
    }

    if (!settings.university) {
      setAddLinkError('Please select a college in settings first');
      return;
    }

    // Ensure URL has a protocol
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const res = await fetch('/api/custom-quick-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLinkLabel.trim(),
          url: url,
          university: settings.university,
        }),
      });

      if (res.ok) {
        const { link } = await res.json();
        setCustomLinks((prev) => {
          const newLinks = [...prev, link];
          localStorage.setItem('customQuickLinks', JSON.stringify(newLinks));
          return newLinks;
        });
        setNewLinkLabel('');
        setNewLinkUrl('');
        setShowAddLinkForm(false);
        setAddLinkError('');
      } else {
        const data = await res.json();
        setAddLinkError(data.error || 'Failed to add link');
      }
    } catch (error) {
      console.error('Error adding custom link:', error);
      setAddLinkError('Failed to add link');
    }
  };

  const performRemoveCustomLink = async (id: string) => {
    try {
      const res = await fetch(`/api/custom-quick-links/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCustomLinks((prev) => {
          const newLinks = prev.filter((link) => link.id !== id);
          localStorage.setItem('customQuickLinks', JSON.stringify(newLinks));
          return newLinks;
        });
      }
    } catch (error) {
      console.error('Error removing custom link:', error);
    }
  };

  const removeCustomLink = (id: string, label: string) => {
    if (confirmBeforeDelete) {
      setConfirmModal({
        isOpen: true,
        title: 'Remove Link',
        message: `Are you sure you want to remove "${label}" from your quick links? This action cannot be undone.`,
        onConfirm: async () => {
          await performRemoveCustomLink(id);
          setConfirmModal(null);
        },
      });
    } else {
      // Show toast with undo
      setPendingLinkRemove({ type: 'custom', id, label });

      // Clear any existing timeout
      if (pendingLinkTimeout.current) {
        clearTimeout(pendingLinkTimeout.current);
      }

      showDeleteToast(`"${label}" removed`, () => {
        // Undo - cancel the removal
        if (pendingLinkTimeout.current) {
          clearTimeout(pendingLinkTimeout.current);
          pendingLinkTimeout.current = null;
        }
        setPendingLinkRemove(null);
      });

      // Schedule actual removal after toast duration
      pendingLinkTimeout.current = setTimeout(async () => {
        await performRemoveCustomLink(id);
        setPendingLinkRemove(null);
        pendingLinkTimeout.current = null;
      }, 5000);
    }
  };

  const performHideDefaultLink = async (university: string, linkLabel: string) => {
    const currentHidden = settings.hiddenQuickLinks || {};
    const universityHidden = currentHidden[university] || [];

    if (!universityHidden.includes(linkLabel)) {
      const newHidden = {
        ...currentHidden,
        [university]: [...universityHidden, linkLabel],
      };
      await updateSettings({ hiddenQuickLinks: newHidden });
    }
  };

  const hideDefaultLink = (university: string, linkLabel: string) => {
    if (confirmBeforeDelete) {
      setConfirmModal({
        isOpen: true,
        title: 'Hide Link',
        message: `Are you sure you want to hide "${linkLabel}"? You can restore it later from the Hidden Links section.`,
        onConfirm: async () => {
          await performHideDefaultLink(university, linkLabel);
          setConfirmModal(null);
        },
      });
    } else {
      // Show toast with undo
      setPendingLinkRemove({ type: 'default', university, label: linkLabel });

      // Clear any existing timeout
      if (pendingLinkTimeout.current) {
        clearTimeout(pendingLinkTimeout.current);
      }

      showDeleteToast(`"${linkLabel}" hidden`, () => {
        // Undo - cancel the hide
        if (pendingLinkTimeout.current) {
          clearTimeout(pendingLinkTimeout.current);
          pendingLinkTimeout.current = null;
        }
        setPendingLinkRemove(null);
      });

      // Schedule actual hide after toast duration
      pendingLinkTimeout.current = setTimeout(async () => {
        await performHideDefaultLink(university, linkLabel);
        setPendingLinkRemove(null);
        pendingLinkTimeout.current = null;
      }, 5000);
    }
  };

  const unhideDefaultLink = async (university: string, linkLabel: string) => {
    const currentHidden = settings.hiddenQuickLinks || {};
    const universityHidden = currentHidden[university] || [];

    const newHidden = {
      ...currentHidden,
      [university]: universityHidden.filter((l) => l !== linkLabel),
    };
    await updateSettings({ hiddenQuickLinks: newHidden });
  };

  // Locked card for premium tools
  const renderLockedCard = (cardId: string, title: string, subtitle: string) => {
    return visibleToolsCards.includes(cardId) && (
      <CollapsibleCard key={cardId} id={`locked-${cardId}`} title={title} subtitle={subtitle}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 16px' : '40px 24px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Lock size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Premium Feature
            </h3>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              color: 'var(--text-muted)',
              maxWidth: '300px',
              lineHeight: 1.5,
            }}>
              Upgrade to Premium to unlock {title} and other powerful tools.
            </p>
          </div>
          <Link href="/pricing">
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '10px 20px' : '12px 24px',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: isMobile ? '14px' : '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}>
              <Crown size={18} />
              Upgrade to Premium
            </button>
          </Link>
        </div>
      </CollapsibleCard>
    );
  };

  // Map card IDs to their rendering components
  const renderCard = (cardId: string) => {
    // Premium tools (all except Quick Links)
    const isPremiumTool = cardId !== TOOLS_CARDS.QUICK_LINKS;

    // Check if user has premium access
    if (isPremiumTool && !subscription.isPremium && !subscription.isLoading) {
      switch (cardId) {
        case TOOLS_CARDS.POMODORO_TIMER:
          return renderLockedCard(cardId, 'Pomodoro Timer', 'Focus sessions for productive study');
        case TOOLS_CARDS.GRADE_TRACKER:
          return renderLockedCard(cardId, 'Grade Tracker', 'Track your grades and GPA by semester');
        case TOOLS_CARDS.GPA_TREND_CHART:
          return renderLockedCard(cardId, 'GPA Trend', 'Visualize your academic progress');
        case TOOLS_CARDS.WHAT_IF_PROJECTOR:
          return renderLockedCard(cardId, 'What-If GPA Projector', 'See how future grades impact your GPA');
        case TOOLS_CARDS.GPA_CALCULATOR:
          return renderLockedCard(cardId, 'GPA Calculator', 'Calculate your GPA from individual courses');
      }
    }

    switch (cardId) {
      case TOOLS_CARDS.POMODORO_TIMER:
        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="pomodoro-timer" title="Pomodoro Timer" subtitle="Focus sessions for productive study">
            <PomodoroTimer theme={settings.theme} />
          </CollapsibleCard>
        );
      case TOOLS_CARDS.GRADE_TRACKER:
        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="grade-tracker" title="Grade Tracker" subtitle="Track your grades and GPA by semester">
            <GradeTracker courses={courses} theme={settings.theme} onEntriesChange={refreshGpaEntries} />
          </CollapsibleCard>
        );
      case TOOLS_CARDS.GPA_TREND_CHART:
        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="gpa-trend" title="GPA Trend" subtitle="Visualize your academic progress">
            <GpaTrendChart entries={gpaEntries} />
          </CollapsibleCard>
        );
      case TOOLS_CARDS.WHAT_IF_PROJECTOR:
        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="whatif-projector" title="What-If GPA Projector" subtitle="See how future grades impact your GPA">
            <WhatIfProjector />
          </CollapsibleCard>
        );
      case TOOLS_CARDS.GPA_CALCULATOR:
        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="gpa-calculator" title="GPA Calculator" subtitle="Calculate your GPA from individual courses">
            <div className={isMobile ? 'space-y-3' : 'space-y-5'}>
              {/* Form Fields */}
              <div className={isMobile ? 'space-y-2' : 'space-y-4'}>
                {formCourses.map((course, idx) => (
                  <div key={idx} style={{ paddingBottom: isMobile ? '4px' : '8px' }}>
                    {idx === 0 && (
                      <div className="flex gap-3 mb-2" style={{ display: isMobile ? 'none' : 'flex' }}>
                        <div className="flex-1">
                          <div style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Course
                          </div>
                        </div>
                        <div style={{ minWidth: '140px' }}>
                          <div style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Grade Type
                          </div>
                        </div>
                        <div style={{ minWidth: '120px' }}>
                          <div style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Grade
                          </div>
                        </div>
                        <div style={{ minWidth: '80px' }}>
                          <div style={{ fontSize: isMobile ? '11px' : '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Credits
                          </div>
                        </div>
                        <div style={{ width: '34px' }}></div>
                      </div>
                    )}
                    <div className="flex gap-3 items-end" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                      <div className="flex-1">
                        {idx === 0 && <div style={{ marginBottom: '4px' }}></div>}
                        <Select
                          value={course.courseName}
                          onChange={(e) => updateCourse(idx, 'courseName', e.target.value)}
                          options={[
                            { value: '', label: 'Select a course...' },
                            ...courses.map((c) => ({ value: c.name, label: getCourseDisplayName(c as any) })),
                          ]}
                        />
                      </div>

                      <div style={{ minWidth: '140px' }}>
                        {idx === 0 && <div style={{ marginBottom: '4px' }}></div>}
                        <Select
                          value={course.gradeType}
                          onChange={(e) => updateCourse(idx, 'gradeType', e.target.value)}
                          options={[
                            { value: 'letter', label: 'Letter Grade' },
                            { value: 'percentage', label: 'Percentage' },
                          ]}
                        />
                      </div>

                      <div style={{ minWidth: '120px' }}>
                        {idx === 0 && <div style={{ marginBottom: '4px' }}></div>}
                        {course.gradeType === 'letter' ? (
                          <Select
                            value={course.grade}
                            onChange={(e) => updateCourse(idx, 'grade', e.target.value)}
                            options={Object.keys(gradePoints).map((g) => ({ value: g, label: g }))}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={course.grade}
                            onChange={(e) => updateCourse(idx, 'grade', e.target.value)}
                            placeholder="e.g., 89.75"
                          />
                        )}
                      </div>

                      <div style={{ minWidth: '80px' }}>
                        {idx === 0 && <div style={{ marginBottom: '4px' }}></div>}
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="12"
                          value={course.credits}
                          onChange={(e) => updateCourse(idx, 'credits', e.target.value)}
                        />
                      </div>

                      <button
                        onClick={() => removeCourse(idx)}
                        className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                        style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px', position: 'relative', top: '-3px' }}
                        title="Remove course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={isMobile ? 'flex flex-col gap-2' : 'flex gap-3'} style={{ marginTop: isMobile ? '12px' : '20px' }}>
                <Button variant="secondary" size={isMobile ? 'sm' : 'md'} type="button" onClick={addCourse} style={{ paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}>
                  <Plus size={isMobile ? 14 : 18} />
                  Add Row
                </Button>

                <Button size={isMobile ? 'sm' : 'lg'} onClick={calculateGPA} style={{ paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}>
                  Calculate GPA
                </Button>
              </div>

              {gpaResult !== null && (
                <div className="rounded-[16px] bg-[var(--accent-bg)] border border-[var(--accent)] text-center" style={{ marginTop: isMobile ? '12px' : '24px', padding: isMobile ? '12px' : '16px' }}>
                  <div className="text-sm text-[var(--text-muted)]" style={{ marginBottom: isMobile ? '4px' : '8px', fontSize: isMobile ? '12px' : '14px' }}>Your GPA</div>
                  <div className="font-bold" style={{ fontSize: isMobile ? '28px' : '32px', color: 'var(--link)' }}>
                    {gpaResult}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleCard>
        );
      case TOOLS_CARDS.QUICK_LINKS:
        const universityCustomLinks = customLinks
          .filter((link) => link.university === settings.university)
          .filter((link) => !(pendingLinkRemove?.type === 'custom' && pendingLinkRemove.id === link.id));
        const hiddenLinksForUniversity = (settings.hiddenQuickLinks && settings.university) ? (settings.hiddenQuickLinks[settings.university] || []) : [];
        const allDefaultLinks = settings.university ? getQuickLinks(settings.university) : [];
        const visibleDefaultLinks = allDefaultLinks
          .filter((link) => !hiddenLinksForUniversity.includes(link.label))
          .filter((link) => !(pendingLinkRemove?.type === 'default' && pendingLinkRemove.label === link.label));
        const hiddenDefaultLinks = allDefaultLinks.filter((link) => hiddenLinksForUniversity.includes(link.label));

        return visibleToolsCards.includes(cardId) && (
          <CollapsibleCard key={cardId} id="quick-links" title="Quick Links" subtitle={settings.university ? `Resources for ${settings.university}` : 'Select a college to view quick links'}>
            {mounted && settings.university ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
                {/* Links Grid */}
                <div className={isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-4 gap-3'}>
                  {/* Default Links (visible) */}
                  {visibleDefaultLinks.map((link) => (
                    <div
                      key={link.label}
                      style={{ position: 'relative' }}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[12px] text-center font-medium transition-colors hover:opacity-80"
                        style={{ display: 'block', padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '12px' : '14px', backgroundColor: settings.theme === 'light' ? 'var(--panel)' : 'var(--panel-2)', color: 'var(--text)', border: '2px solid var(--border)' }}
                      >
                        {link.label}
                      </a>
                      {isEditingLinks && (
                        <button
                          onClick={() => hideDefaultLink(settings.university!, link.label)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            padding: 0,
                          }}
                          title="Hide link"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Custom Links */}
                  {universityCustomLinks.map((link) => (
                    <div
                      key={link.id}
                      style={{ position: 'relative' }}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[12px] text-center font-medium transition-colors hover:opacity-80"
                        style={{ display: 'block', padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '12px' : '14px', backgroundColor: settings.theme === 'light' ? 'var(--panel)' : 'var(--panel-2)', color: 'var(--text)', border: '2px solid var(--border)' }}
                      >
                        {link.label}
                      </a>
                      {isEditingLinks && (
                        <button
                          onClick={() => removeCustomLink(link.id, link.label)}
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            padding: 0,
                          }}
                          title="Remove link"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hidden Links Section - only show in edit mode */}
                {isEditingLinks && hiddenDefaultLinks.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: isMobile ? '12px' : '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Hidden Links
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {hiddenDefaultLinks.map((link) => (
                        <button
                          key={link.label}
                          onClick={() => unhideDefaultLink(settings.university!, link.label)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            backgroundColor: 'var(--panel-2)',
                            color: 'var(--text-muted)',
                            border: '1px dashed var(--border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Click to restore"
                        >
                          <Plus size={12} />
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Link Form - only show in edit mode */}
                {isEditingLinks && showAddLinkForm && (
                  <div style={{ padding: isMobile ? '12px' : '16px', backgroundColor: 'var(--panel-2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{ flex: 1 }}>
                          <Input
                            type="text"
                            placeholder="Link name"
                            value={newLinkLabel}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <Input
                            type="text"
                            placeholder="URL (e.g., https://example.com)"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      {addLinkError && (
                        <div style={{ color: 'var(--danger)', fontSize: '13px' }}>{addLinkError}</div>
                      )}
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowAddLinkForm(false);
                            setNewLinkLabel('');
                            setNewLinkUrl('');
                            setAddLinkError('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={addCustomLink}>
                          Add Link
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Button
                    variant="secondary"
                    size={isMobile ? 'sm' : 'md'}
                    onClick={() => {
                      setIsEditingLinks(!isEditingLinks);
                      if (isEditingLinks) {
                        setShowAddLinkForm(false);
                        setNewLinkLabel('');
                        setNewLinkUrl('');
                        setAddLinkError('');
                      }
                    }}
                    style={{ paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}
                  >
                    <Pencil size={isMobile ? 14 : 18} />
                    {isEditingLinks ? 'Done' : 'Edit'}
                  </Button>
                  {isEditingLinks && !showAddLinkForm && (
                    <Button
                      variant="secondary"
                      size={isMobile ? 'sm' : 'md'}
                      onClick={() => setShowAddLinkForm(true)}
                      style={{ paddingLeft: isMobile ? '10px' : '16px', paddingRight: isMobile ? '10px' : '16px' }}
                    >
                      <Plus size={isMobile ? 14 : 18} />
                      Add Link
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: isMobile ? '16px' : '24px', color: 'var(--text-muted)', fontSize: isMobile ? '13px' : '14px' }}>
                <p>Select a college in settings to view quick links</p>
              </div>
            )}
          </CollapsibleCard>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Tools Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Tools
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Useful utilities for your semester.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1400px]" style={{ paddingLeft: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingRight: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingBottom: isMobile ? 'clamp(12px, 4%, 24px)' : '24px', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-1 gap-[var(--grid-gap)]">
          {subscription.isPremium ? (
            // Premium users see all tools
            toolsCardsOrder.map((cardId: string) => renderCard(cardId))
          ) : (
            // Free users see only Quick Links + Premium info card
            <>
              {renderCard(TOOLS_CARDS.QUICK_LINKS)}

              {/* Premium Tools Info Card - floating over background */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: isMobile ? '40px 0' : '60px 0' }}>
                <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--panel-2) 0%, var(--panel) 100%)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <Lock size={36} className="text-[var(--text-muted)]" />
                    </div>
                  </div>

                  <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' }}>
                    Premium Tools
                  </h2>

                  <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                    Upgrade to Premium to unlock powerful study tools including GPA Calculator, Grade Tracker, Pomodoro Timer, and more.
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <Link href="/pricing">
                      <Button variant="primary" size="lg" style={{ minWidth: '200px' }}>
                        <Crown size={18} />
                        View Plans
                      </Button>
                    </Link>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Your data is safely stored and will be accessible once you subscribe.
                  </p>

                  <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Premium tools include:</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '360px', margin: '0 auto', textAlign: 'left' }}>
                      {[
                        'GPA Calculator',
                        'Grade Tracker',
                        'GPA Trend Chart',
                        'What-If GPA Projector',
                        'Pomodoro Timer',
                      ].map((item) => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.5)', flexShrink: 0 }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
            onClick={() => setConfirmModal(null)}
          />
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              minWidth: isMobile ? '280px' : '360px',
              maxWidth: '90%',
              zIndex: 1001,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: '12px',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {confirmModal.title}
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: '20px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal(null)}
                style={{
                  padding: '8px 16px',
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmModal.onConfirm}
                style={{
                  backgroundColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                  borderColor: settings.theme === 'light' ? 'var(--danger)' : '#660000',
                  color: 'white',
                  padding: '8px 16px',
                  boxShadow: settings.theme === 'light' ? '0 0 0 1px rgba(229, 83, 75, 0.3)' : '0 0 0 1px #731915',
                }}
              >
                {confirmModal.title === 'Remove Link' ? 'Remove' : 'Hide'}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
