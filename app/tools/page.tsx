'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';
import { getQuickLinks } from '@/lib/quickLinks';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface GpaEntry {
  id: string;
  courseId: string | null;
  courseName: string;
  grade: string;
  credits: number;
}

interface FormCourse {
  id?: string;
  courseName: string;
  gradeType: 'letter' | 'percentage';
  grade: string;
  credits: string;
}

export default function ToolsPage() {
  const { settings } = useAppStore();
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formCourses, setFormCourses] = useState<FormCourse[]>([
    { courseName: '', gradeType: 'letter', grade: 'A', credits: '3' },
  ]);
  const [gpaResult, setGpaResult] = useState<number | null>(null);

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

  // Fetch courses and load saved GPA entries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, entriesRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/gpa-entries'),
        ]);

        if (coursesRes.ok) {
          const { courses: fetchedCourses } = await coursesRes.json();
          setCourses(fetchedCourses);
        }

        if (entriesRes.ok) {
          const { entries: fetchedEntries } = await entriesRes.json();
          if (fetchedEntries.length > 0) {
            // Convert saved entries to form courses
            const savedCourses = fetchedEntries.map((entry: GpaEntry) => ({
              id: entry.id,
              courseName: entry.courseName,
              gradeType: entry.grade.includes('.') || !Object.keys({ 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 }).includes(entry.grade) ? 'percentage' : 'letter',
              grade: entry.grade,
              credits: entry.credits.toString(),
            }));
            setFormCourses(savedCourses);
          }
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
        if (fetchedEntries.length > 0) {
          const savedCourses = fetchedEntries.map((entry: GpaEntry) => ({
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

  return (
    <>
      <PageHeader title="Tools" subtitle="Useful utilities for your semester" />
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: '24px' }}>
        <div className="grid grid-cols-1 gap-[var(--grid-gap)]">
          {/* Quick Links */}
          <Card title="Quick Links" subtitle={settings.university ? `Resources for ${settings.university}` : 'Select a college to view quick links'}>
            {mounted && settings.university ? (
              <div className="grid grid-cols-4 gap-3">
                {getQuickLinks(settings.university).map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[12px] text-center text-sm font-medium text-white transition-colors hover:opacity-80"
                    style={{ display: 'block', padding: '12px', backgroundColor: '#505050', border: '2px solid var(--border)' }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                <p>Select a college in settings to view quick links</p>
              </div>
            )}
          </Card>

          {/* GPA Calculator */}
          <Card title="GPA Calculator">
            <div className="space-y-5">
              {/* Form Fields */}
              <div className="space-y-4">
                {formCourses.map((course, idx) => (
                  <div key={idx} style={{ paddingBottom: '8px' }}>
                    {idx === 0 && (
                      <div className="flex gap-3 mb-2">
                        <div className="flex-1">
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Course
                          </div>
                        </div>
                        <div style={{ minWidth: '140px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Grade Type
                          </div>
                        </div>
                        <div style={{ minWidth: '120px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Grade
                          </div>
                        </div>
                        <div style={{ minWidth: '80px' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                            Credits
                          </div>
                        </div>
                        <div style={{ width: '34px' }}></div>
                      </div>
                    )}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        {idx === 0 && <div style={{ marginBottom: '4px' }}></div>}
                        <Select
                          value={course.courseName}
                          onChange={(e) => updateCourse(idx, 'courseName', e.target.value)}
                          options={[
                            { value: '', label: 'Select a course...' },
                            ...courses.map((c) => ({ value: c.name, label: c.name })),
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

              <div className="flex gap-3" style={{ marginTop: '20px' }}>
                <Button variant="secondary" size="md" type="button" onClick={addCourse}>
                  <Plus size={18} />
                  Add Row
                </Button>

                <Button size="lg" onClick={calculateGPA} style={{ backgroundColor: 'var(--button-secondary)', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', paddingLeft: '16px', paddingRight: '16px' }}>
                  Calculate GPA
                </Button>
              </div>

              {gpaResult !== null && (
                <div className="rounded-[16px] bg-[var(--accent-bg)] border border-[var(--accent)] text-center" style={{ marginTop: '24px', padding: '16px' }}>
                  <div className="text-sm text-[var(--text-muted)]" style={{ marginBottom: '8px' }}>Your GPA</div>
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    {gpaResult}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
