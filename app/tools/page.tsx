'use client';

import { useState } from 'react';
import Card from '@/components/Card';

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
    <div className="space-y-6 p-4 md:p-8">
      <h2 className="text-2xl font-bold">Tools</h2>

      <Card title="GPA Calculator">
        <div className="space-y-3">
          {gpaForm.courses.map((course, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={course.name}
                onChange={(e) => {
                  const newCourses = [...gpaForm.courses];
                  newCourses[idx].name = e.target.value;
                  setGpaForm({ ...gpaForm, courses: newCourses });
                }}
                placeholder="Course name"
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <select
                value={course.grade}
                onChange={(e) => {
                  const newCourses = [...gpaForm.courses];
                  newCourses[idx].grade = e.target.value;
                  setGpaForm({ ...gpaForm, courses: newCourses });
                }}
                className="w-20 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                {Object.keys(gradePoints).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <input
                type="number"
                value={course.credits}
                onChange={(e) => {
                  const newCourses = [...gpaForm.courses];
                  newCourses[idx].credits = e.target.value;
                  setGpaForm({ ...gpaForm, courses: newCourses });
                }}
                min="1"
                max="12"
                className="w-16 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              />
              <button
                onClick={() => removeCourse(idx)}
                className="text-red-600 dark:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addCourse}
            className="text-xs text-blue-600 dark:text-blue-400"
          >
            + Add Course
          </button>

          <button
            onClick={calculateGPA}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Calculate GPA
          </button>

          {gpaResult !== null && (
            <div className="mt-4 rounded bg-blue-50 p-4 text-center dark:bg-blue-950">
              <div className="text-xs text-gray-600 dark:text-gray-400">Your GPA</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {gpaResult}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Quick Links">
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://byui.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            BYU
          </a>
          <a
            href="https://mymap.byu.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            MyMAP
          </a>
          <a
            href="https://registration.byu.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Registration
          </a>
          <a
            href="https://lib.byu.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Library
          </a>
        </div>
      </Card>
    </div>
  );
}
