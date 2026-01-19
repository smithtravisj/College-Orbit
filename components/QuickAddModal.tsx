'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import useAppStore from '@/lib/store';
import { getCollegeColorPalette, getCustomColorSetForTheme, CustomColors } from '@/lib/collegeColors';
import CalendarPicker from './CalendarPicker';
import TimePicker from './TimePicker';
import { ShoppingListType, GROCERY_CATEGORIES, WISHLIST_CATEGORIES, PANTRY_CATEGORIES } from '@/types';
import { useModalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { parseNaturalLanguage } from '@/lib/naturalLanguageParser';
import styles from './QuickAddModal.module.css';

type QuickAddType = 'task' | 'assignment' | 'exam' | 'note' | 'course' | 'shopping';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: QuickAddType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam' },
  { value: 'note', label: 'Note' },
  { value: 'course', label: 'Course' },
];

const SHOPPING_LIST_OPTIONS: { value: ShoppingListType; label: string }[] = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'pantry', label: 'Pantry' },
];

const QUICK_INPUT_PLACEHOLDERS: Record<QuickAddType, string> = {
  task: 'e.g. Finish chapter 3 CS 101 tomorrow',
  assignment: 'e.g. Essay draft ENG 201 Jan 26 5pm',
  exam: 'e.g. Calc midterm Feb 2 1pm Room 102',
  note: 'e.g. Lecture notes CS 101',
  course: 'e.g. CS 101 Intro to Computer Science',
  shopping: 'e.g. 2 gallons milk',
};

// Map pathname to QuickAddType
const getTypeFromPathname = (pathname: string): QuickAddType | null => {
  if (pathname === '/tasks') return 'task';
  if (pathname === '/deadlines') return 'assignment';
  if (pathname === '/exams') return 'exam';
  if (pathname === '/notes') return 'note';
  if (pathname === '/courses') return 'course';
  return null; // Return null for other pages to keep the last selected type
};

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [selectedType, setSelectedType] = useState<QuickAddType>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [location, setLocation] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [shoppingListType, setShoppingListType] = useState<ShoppingListType>('grocery');
  const [quantity, setQuantity] = useState(1);

  // Store actions
  const addTask = useAppStore((state) => state.addTask);
  const addDeadline = useAppStore((state) => state.addDeadline);
  const addExam = useAppStore((state) => state.addExam);
  const addNote = useAppStore((state) => state.addNote);
  const addCourse = useAppStore((state) => state.addCourse);
  const addShoppingItem = useAppStore((state) => state.addShoppingItem);
  const courses = useAppStore((state) => state.courses);
  const university = useAppStore((state) => state.settings.university) || null;
  const theme = useAppStore((state) => state.settings.theme);
  const isPremium = useAppStore((state) => state.isPremium);
  const savedUseCustomTheme = useAppStore((state) => state.settings.useCustomTheme);
  const savedCustomColors = useAppStore((state) => state.settings.customColors);

  // Only use custom theme if premium
  const useCustomTheme = isPremium ? savedUseCustomTheme : false;
  const customColors = isPremium ? savedCustomColors : null;

  // Determine accent color based on custom theme or college palette
  const accentColor = useCustomTheme && customColors
    ? getCustomColorSetForTheme(customColors as CustomColors, theme).accent
    : getCollegeColorPalette(university, theme).accent;

  // Reset form and set type based on current page when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Set type based on current page, or keep last selected type for other pages
      const pageType = getTypeFromPathname(pathname);
      if (pageType) {
        setSelectedType(pageType);
      }
    }
  }, [isOpen, pathname]);

  const resetForm = () => {
    setQuickInput('');
    setTitle('');
    setCourseId(null);
    setDueDate('');
    setDueTime('');
    setLocation('');
    setCourseCode('');
    setCourseName('');
    setShoppingListType('grocery');
    setQuantity(1);
  };

  // Handle quick input parsing
  const handleQuickInputChange = useCallback((value: string) => {
    setQuickInput(value);

    if (!value.trim()) {
      // Clear all parsed fields when input is empty
      setTitle('');
      setCourseId(null);
      setDueDate('');
      setDueTime('');
      setLocation('');
      setCourseCode('');
      setCourseName('');
      return;
    }

    // Parse using the selected type directly
    const parsed = parseNaturalLanguage(value, {
      courses,
      itemType: selectedType,
      shoppingListType: shoppingListType,
    });

    // Apply parsed values based on selected type
    if (selectedType === 'course') {
      // For course type, use courseCode and courseName
      setCourseCode(parsed.courseCode || '');
      setCourseName(parsed.courseName || '');
    } else {
      // For other types, use title, course, date, time, location
      setTitle(parsed.title || '');
      setCourseId(parsed.courseId);
      setDueDate(parsed.date || '');
      setDueTime(parsed.time || '');
      setLocation(parsed.location || '');
    }
  }, [courses, selectedType, shoppingListType]);

  // Re-parse quick input when type changes (but don't clear it) and refocus input
  useEffect(() => {
    if (quickInput.trim()) {
      // Re-run the parsing with the new selected type
      const parsed = parseNaturalLanguage(quickInput, {
        courses,
        itemType: selectedType,
        shoppingListType: shoppingListType,
      });
      if (selectedType === 'course') {
        setCourseCode(parsed.courseCode || '');
        setCourseName(parsed.courseName || '');
      } else {
        setTitle(parsed.title || '');
        setCourseId(parsed.courseId);
        setDueDate(parsed.date || '');
        setDueTime(parsed.time || '');
        setLocation(parsed.location || '');
      }
    }
    // Refocus the quick input after type change
    quickInputRef.current?.focus();
  }, [selectedType, courses, shoppingListType, quickInput]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getCategoryForListType = (listType: ShoppingListType): string => {
    switch (listType) {
      case 'grocery':
        return GROCERY_CATEGORIES[0];
      case 'wishlist':
        return WISHLIST_CATEGORIES[0];
      case 'pantry':
        return PANTRY_CATEGORIES[0];
      default:
        return 'Other';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      switch (selectedType) {
        case 'task': {
          if (!title.trim()) return;
          let dueAt: string | null = null;
          if (dueDate) {
            const timeStr = dueTime || '23:59';
            dueAt = new Date(`${dueDate}T${timeStr}`).toISOString();
          }
          await addTask({
            title: title.trim(),
            courseId: courseId || null,
            dueAt,
            pinned: false,
            importance: null,
            checklist: [],
            notes: '',
            tags: [],
            links: [],
            status: 'open',
            workingOn: false,
            updatedAt: new Date().toISOString(),
            recurringPatternId: null,
            instanceDate: null,
            isRecurring: false,
          });
          break;
        }
        case 'assignment': {
          if (!title.trim()) return;
          let dueAt: string | null = null;
          if (dueDate) {
            const timeStr = dueTime || '23:59';
            dueAt = new Date(`${dueDate}T${timeStr}`).toISOString();
          }
          await addDeadline({
            title: title.trim(),
            courseId: courseId || null,
            dueAt,
            priority: null,
            effort: null,
            notes: '',
            tags: [],
            links: [],
            status: 'open',
            workingOn: false,
            updatedAt: new Date().toISOString(),
            recurringPatternId: null,
            instanceDate: null,
            isRecurring: false,
          });
          break;
        }
        case 'exam': {
          if (!title.trim() || !dueDate) return;
          const timeStr = dueTime || '12:00';
          const examAt = new Date(`${dueDate}T${timeStr}`).toISOString();
          await addExam({
            title: title.trim(),
            courseId: courseId || null,
            examAt,
            location: location.trim() || null,
            notes: '',
            tags: [],
            links: [],
            status: 'scheduled',
          });
          break;
        }
        case 'note': {
          if (!title.trim()) return;
          await addNote({
            title: title.trim(),
            content: null,
            folderId: null,
            courseId: courseId || null,
            taskId: null,
            deadlineId: null,
            examId: null,
            recurringTaskPatternId: null,
            recurringDeadlinePatternId: null,
            recurringExamPatternId: null,
            tags: [],
            isPinned: false,
            links: [],
          });
          break;
        }
        case 'course': {
          if (!courseCode.trim() || !courseName.trim()) return;
          await addCourse({
            code: courseCode.trim(),
            name: courseName.trim(),
            term: '',
            meetingTimes: [],
            links: [],
          });
          break;
        }
        case 'shopping': {
          if (!title.trim()) return;
          await addShoppingItem({
            listType: shoppingListType,
            name: title.trim(),
            quantity: quantity || 1,
            unit: null,
            category: getCategoryForListType(shoppingListType),
            notes: '',
            checked: false,
            priority: null,
            price: null,
            perishable: null,
          });
          break;
        }
      }
      handleClose();
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    switch (selectedType) {
      case 'task':
      case 'assignment':
      case 'note':
      case 'shopping':
        return title.trim().length > 0;
      case 'exam':
        return title.trim().length > 0 && dueDate.length > 0;
      case 'course':
        return courseCode.trim().length > 0 && courseName.trim().length > 0;
      default:
        return false;
    }
  };

  // Keyboard shortcuts for modal
  useModalShortcuts({
    isOpen,
    onClose,
    onSubmit: () => {
      if (canSubmit() && !isSubmitting) {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      }
    },
  });

  if (!isOpen) return null;

  const renderForm = () => {
    switch (selectedType) {
      case 'task':
      case 'assignment':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedType === 'task' ? 'What needs to be done?' : 'Assignment name'}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <CalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  label="Due Date"
                />
              </div>
              <div className={styles.formGroup}>
                <TimePicker
                  value={dueTime}
                  onChange={setDueTime}
                  label="Due Time"
                />
              </div>
            </div>
          </>
        );

      case 'exam':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Exam name"
                className={styles.input}
              />
            </div>
            <div className={styles.dateTimeRow}>
              <div className={styles.formGroup}>
                <CalendarPicker
                  value={dueDate}
                  onChange={setDueDate}
                  label="Date *"
                />
              </div>
              <div className={styles.formGroup}>
                <TimePicker
                  value={dueTime}
                  onChange={setDueTime}
                  label="Time"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room or building"
                className={styles.input}
              />
            </div>
          </>
        );

      case 'note':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course</label>
              <select
                value={courseId || ''}
                onChange={(e) => setCourseId(e.target.value || null)}
                className={styles.select}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case 'course':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course Code *</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS 101"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Course Name *</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Introduction to Computer Science"
                className={styles.input}
              />
            </div>
          </>
        );

      case 'shopping':
        return (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Item Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need?"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>List</label>
              <select
                value={shoppingListType}
                onChange={(e) => setShoppingListType(e.target.value as ShoppingListType)}
                className={styles.select}
              >
                {SHOPPING_LIST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className={styles.input}
                style={{ width: '100px' }}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Mobile: Full-screen slide-up modal
  if (isMobile) {
    return (
      <>
        <div className={styles.backdrop} onClick={handleClose} />
        <div className={styles.mobileModal}>
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>Quick Add</h2>
            <button
              onClick={handleClose}
              className={styles.closeButton}
              aria-label="Close"
              type="button"
            >
              <X size={24} />
            </button>
          </div>

          <div className={styles.mobileContent}>
            {/* Type Selector Pills */}
            <div className={styles.typeSelector}>
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`${styles.typePill} ${selectedType === option.value ? styles.typePillActive : ''}`}
                  style={selectedType === option.value ? {
                    backgroundColor: accentColor,
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                    boxShadow: `0 0 12px ${accentColor}40`,
                    borderColor: accentColor
                  } : {}}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Quick Input Box (Premium Feature) */}
            {isPremium && (
              <div className={styles.quickInputContainer}>
                <div className={styles.quickInputWrapper}>
                  <Sparkles size={16} className={styles.quickInputIcon} />
                  <input
                    ref={quickInputRef}
                    type="text"
                    value={quickInput}
                    onChange={(e) => handleQuickInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit()) {
                        e.preventDefault();
                        handleSubmit(e as unknown as React.FormEvent);
                      }
                    }}
                    placeholder={QUICK_INPUT_PLACEHOLDERS[selectedType]}
                    className={styles.quickInput}
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {renderForm()}

              <button
                type="submit"
                disabled={!canSubmit() || isSubmitting}
                className={styles.submitButton}
                style={canSubmit() ? {
                  backgroundColor: accentColor,
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                  boxShadow: `0 0 12px ${accentColor}40`
                } : undefined}
              >
                {isSubmitting ? 'Creating...' : `Create ${TYPE_OPTIONS.find(o => o.value === selectedType)?.label}`}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // Desktop: Centered floating modal
  return (
    <>
      <div className={styles.backdrop} onClick={handleClose} />
      <div className={styles.desktopModal}>
        <div className={styles.desktopHeader}>
          <h2 className={styles.desktopTitle}>Quick Add</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Selector Pills */}
        <div className={styles.typeSelector}>
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedType(option.value)}
              className={`${styles.typePill} ${selectedType === option.value ? styles.typePillActive : ''}`}
              style={selectedType === option.value ? {
                backgroundColor: accentColor,
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
                boxShadow: `0 0 12px ${accentColor}40`,
                borderColor: accentColor
              } : {}}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Quick Input Box (Premium Feature) */}
        {isPremium && (
          <div className={styles.quickInputContainer}>
            <div className={styles.quickInputWrapper}>
              <Sparkles size={16} className={styles.quickInputIcon} />
              <input
                ref={quickInputRef}
                type="text"
                value={quickInput}
                onChange={(e) => handleQuickInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSubmit()) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder={QUICK_INPUT_PLACEHOLDERS[selectedType]}
                className={styles.quickInput}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {renderForm()}

          <button
            type="submit"
            disabled={!canSubmit() || isSubmitting}
            className={styles.submitButton}
            style={canSubmit() ? {
              backgroundColor: accentColor,
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
              boxShadow: `0 0 12px ${accentColor}40`
            } : undefined}
          >
            {isSubmitting ? 'Creating...' : `Create ${TYPE_OPTIONS.find(o => o.value === selectedType)?.label}`}
          </button>
        </form>
      </div>
    </>
  );
}
