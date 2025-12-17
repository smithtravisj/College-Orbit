'use client';

import { useState, useEffect } from 'react';
import useAppStore from '@/lib/store';

interface CourseFormProps {
  courseId?: string;
  onClose: () => void;
}

export default function CourseForm({ courseId, onClose }: CourseFormProps) {
  const { courses, addCourse, updateCourse } = useAppStore();
  const course = courses.find((c) => c.id === courseId);

  const [form, setForm] = useState({
    code: '',
    name: '',
    term: '',
    meetingTimes: [{ day: 'Mon', start: '10:00', end: '10:50', location: '' }],
    links: [{ label: '', url: '' }],
    colorTag: '',
  });

  useEffect(() => {
    if (course) {
      setForm({
        code: course.code,
        name: course.name,
        term: course.term,
        meetingTimes: course.meetingTimes || [{ day: 'Mon', start: '10:00', end: '10:50', location: '' }],
        links: course.links || [{ label: '', url: '' }],
        colorTag: course.colorTag || '',
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const courseData = {
      code: form.code,
      name: form.name,
      term: form.term,
      meetingTimes: form.meetingTimes.filter((mt) => mt.location),
      links: form.links.filter((l) => l.label && l.url),
      colorTag: form.colorTag,
    };

    if (courseId) {
      updateCourse(courseId, courseData);
    } else {
      addCourse(courseData);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Course Code (e.g., CHEM 101)"
          className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          required
        />
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Course Name"
          className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          required
        />
      </div>

      <input
        type="text"
        value={form.term}
        onChange={(e) => setForm({ ...form, term: e.target.value })}
        placeholder="Term (e.g., Winter 2026)"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      />

      <div>
        <label className="block text-sm font-medium">Meeting Times</label>
        {form.meetingTimes.map((mt, idx) => (
          <div key={idx} className="mt-2 flex gap-2">
            <select
              value={mt.day}
              onChange={(e) => {
                const newMeetingTimes = [...form.meetingTimes];
                newMeetingTimes[idx].day = e.target.value;
                setForm({ ...form, meetingTimes: newMeetingTimes });
              }}
              className="rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              type="time"
              value={mt.start}
              onChange={(e) => {
                const newMeetingTimes = [...form.meetingTimes];
                newMeetingTimes[idx].start = e.target.value;
                setForm({ ...form, meetingTimes: newMeetingTimes });
              }}
              className="rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <input
              type="time"
              value={mt.end}
              onChange={(e) => {
                const newMeetingTimes = [...form.meetingTimes];
                newMeetingTimes[idx].end = e.target.value;
                setForm({ ...form, meetingTimes: newMeetingTimes });
              }}
              className="rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              value={mt.location}
              onChange={(e) => {
                const newMeetingTimes = [...form.meetingTimes];
                newMeetingTimes[idx].location = e.target.value;
                setForm({ ...form, meetingTimes: newMeetingTimes });
              }}
              placeholder="Location"
              className="flex-1 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setForm({
              ...form,
              meetingTimes: [
                ...form.meetingTimes,
                { day: 'Mon', start: '10:00', end: '10:50', location: '' },
              ],
            });
          }}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400"
        >
          + Add Time
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium">Links</label>
        {form.links.map((link, idx) => (
          <div key={idx} className="mt-2 flex gap-2">
            <input
              type="text"
              value={link.label}
              onChange={(e) => {
                const newLinks = [...form.links];
                newLinks[idx].label = e.target.value;
                setForm({ ...form, links: newLinks });
              }}
              placeholder="Label (e.g., Canvas)"
              className="w-1/3 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
            <input
              type="url"
              value={link.url}
              onChange={(e) => {
                const newLinks = [...form.links];
                newLinks[idx].url = e.target.value;
                setForm({ ...form, links: newLinks });
              }}
              placeholder="URL"
              className="flex-1 rounded border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setForm({
              ...form,
              links: [...form.links, { label: '', url: '' }],
            });
          }}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400"
        >
          + Add Link
        </button>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {courseId ? 'Update' : 'Add'} Course
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
