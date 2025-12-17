'use client';

import { useState, useEffect } from 'react';
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [formCourses, setFormCourses] = useState<FormCourse[]>([
    { courseName: '', gradeType: 'letter', grade: 'A', credits: '3' },
  ]);
  const [gpaResult, setGpaResult] = useState<number | null>(null);

  const gradePoints: { [key: string]: number } = {
    'A+': 4.0,
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
      } catch (error) {
        console.error('Error fetching data:', error);
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
    // First, save all form courses to database
    for (const course of formCourses) {
      if (!course.courseName || !course.credits) continue;

      const selectedCourse = courses.find((c) => c.name === course.courseName);

      if (course.id) {
        // Already saved, skip
        continue;
      } else {
        // New course, save it
        try {
          await fetch('/api/gpa-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: selectedCourse?.id || null,
              courseName: course.courseName,
              grade: course.grade,
              credits: course.credits,
            }),
          });
        } catch (error) {
          console.error('Error saving GPA entry:', error);
        }
      }
    }

    // Calculate GPA
    let totalPoints = 0;
    let totalCredits = 0;

    formCourses.forEach((course) => {
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

  const removeCourse = async (index: number) => {
    const course = formCourses[index];

    // If it's a saved course (has an ID), delete from database
    if (course.id) {
      try {
        await fetch(`/api/gpa-entries/${course.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting GPA entry:', error);
      }
    }

    setFormCourses(formCourses.filter((_, i) => i !== index));
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
          {/* GPA Calculator */}
          <Card title="GPA Calculator">
            <div className="space-y-5">
              {/* Form Fields */}
              <div className="space-y-4">
                {formCourses.map((course, idx) => (
                  <div key={idx} style={{ paddingBottom: '8px' }}>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <div style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          Course
                        </div>
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
                        <div style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          Grade
                        </div>
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
                        <div style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          {course.gradeType === 'letter' ? 'Grade' : 'Grade'}
                        </div>
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
                        <div style={{ marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          Credits
                        </div>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="12"
                          value={course.credits}
                          onChange={(e) => updateCourse(idx, 'credits', e.target.value)}
                        />
                      </div>

                      {idx > 0 && (
                        <button
                          onClick={() => removeCourse(idx)}
                          className="rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors"
                          style={{ padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' }}
                          title="Remove course"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3" style={{ marginTop: '20px' }}>
                <Button variant="secondary" size="md" type="button" onClick={addCourse}>
                  <Plus size={18} />
                  Add Row
                </Button>

                <Button size="lg" onClick={calculateGPA} style={{ backgroundColor: '#132343', color: 'white', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', paddingLeft: '24px', paddingRight: '24px' }}>
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

          {/* Quick Links */}
          <Card title="Quick Links" subtitle="Useful BYU resources">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'BYU', url: 'https://byui.edu' },
                { label: 'MyMAP', url: 'https://mymap.byu.edu' },
                { label: 'Registration', url: 'https://registration.byu.edu' },
                { label: 'Library', url: 'https://lib.byu.edu' },
              ].map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[12px] bg-[var(--panel-2)] hover:bg-[var(--panel-3)] text-center text-sm font-medium text-[var(--text)] transition-colors"
                  style={{ display: 'block', padding: '12px' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
