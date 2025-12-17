'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';

export default function ToolsPage() {
  const [gpaForm, setGpaForm] = useState({
    courses: [{ name: 'Course 1', grade: 'A', credits: '3' }],
  });
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

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    gpaForm.courses.forEach((course) => {
      const points = gradePoints[course.grade] || 0;
      const credits = parseInt(course.credits) || 0;
      totalPoints += points * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    setGpaResult(Math.round(gpa * 100) / 100);
  };

  const addCourse = () => {
    setGpaForm({
      ...gpaForm,
      courses: [...gpaForm.courses, { name: '', grade: 'A', credits: '3' }],
    });
  };

  const removeCourse = (index: number) => {
    setGpaForm({
      ...gpaForm,
      courses: gpaForm.courses.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <PageHeader title="Tools" subtitle="Useful utilities for your semester" />
      <div className="mx-auto max-w-[var(--container)] px-12 py-12 space-y-7">
          {/* GPA Calculator */}
          <Card title="GPA Calculator" padding="lg">
            <div className="space-y-5">
              <div className="space-y-4">
                {gpaForm.courses.map((course, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <Input
                      label={idx === 0 ? 'Course name' : ''}
                      value={course.name}
                      onChange={(e) => {
                        const newCourses = [...gpaForm.courses];
                        newCourses[idx].name = e.target.value;
                        setGpaForm({ ...gpaForm, courses: newCourses });
                      }}
                      placeholder="e.g., Math 101"
                      className="flex-1"
                    />
                    <Select
                      label={idx === 0 ? 'Grade' : ''}
                      value={course.grade}
                      onChange={(e) => {
                        const newCourses = [...gpaForm.courses];
                        newCourses[idx].grade = e.target.value;
                        setGpaForm({ ...gpaForm, courses: newCourses });
                      }}
                      options={Object.keys(gradePoints).map((g) => ({ value: g, label: g }))}
                    />
                    <Input
                      label={idx === 0 ? 'Credits' : ''}
                      type="number"
                      value={course.credits}
                      onChange={(e) => {
                        const newCourses = [...gpaForm.courses];
                        newCourses[idx].credits = e.target.value;
                        setGpaForm({ ...gpaForm, courses: newCourses });
                      }}
                      min="1"
                      max="12"
                      className="w-20"
                    />
                    <button
                      onClick={() => removeCourse(idx)}
                      className="p-2 rounded-[var(--radius-control)] text-[var(--muted)] hover:text-[var(--danger)] hover:bg-white/5 transition-colors mb-0"
                      title="Remove course"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="secondary" type="button" onClick={addCourse}>
                <Plus size={18} />
                Add Course
              </Button>

              <Button variant="primary" onClick={calculateGPA}>
                Calculate GPA
              </Button>

              {gpaResult !== null && (
                <div className="mt-6 p-4 rounded-[16px] bg-[var(--accent-bg)] border border-[var(--accent)] text-center">
                  <div className="text-sm text-[var(--text-muted)] mb-2">Your GPA</div>
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    {gpaResult}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Links */}
          <Card title="Quick Links" subtitle="Useful BYU resources" padding="lg">
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
                  className="p-3 rounded-[12px] bg-[var(--panel-2)] hover:bg-[var(--panel-3)] text-center text-sm font-medium text-[var(--text)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </Card>
      </div>
    </>
  );
}
