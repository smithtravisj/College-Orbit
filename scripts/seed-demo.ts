import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@collegeorbit.app' },
    update: {},
    create: {
      email: 'demo@collegeorbit.app',
      passwordHash: hashedPassword,
      name: 'Demo Student',
    },
  });

  console.log('Created user:', user.email);

  // Create settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'dark',
    },
  });

  // Delete existing data for clean slate
  await prisma.exam.deleteMany({ where: { userId: user.id } });
  await prisma.deadline.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.gpaEntry.deleteMany({ where: { userId: user.id } });
  await prisma.course.deleteMany({ where: { userId: user.id } });

  // Create courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        userId: user.id,
        code: 'CS 301',
        name: 'Data Structures & Algorithms',
        term: 'Winter 2026',
        credits: 4,
        colorTag: '#3b82f6',
        meetingTimes: [
          { days: ['Mon'], start: '10:00', end: '11:15', location: '' },
          { days: ['Wed'], start: '10:00', end: '11:15', location: '' },
        ],
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        code: 'MATH 240',
        name: 'Linear Algebra',
        term: 'Winter 2026',
        credits: 3,
        colorTag: '#10b981',
        meetingTimes: [
          { days: ['Tue'], start: '09:00', end: '09:50', location: '' },
          { days: ['Thu'], start: '09:00', end: '09:50', location: '' },
        ],
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        code: 'PSYC 101',
        name: 'Introduction to Psychology',
        term: 'Winter 2026',
        credits: 3,
        colorTag: '#f59e0b',
        meetingTimes: [
          { days: ['Mon'], start: '14:00', end: '15:15', location: '' },
          { days: ['Wed'], start: '14:00', end: '15:15', location: '' },
        ],
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        code: 'ENGL 201',
        name: 'Academic Writing',
        term: 'Winter 2026',
        credits: 3,
        colorTag: '#8b5cf6',
        meetingTimes: [
          { days: ['Tue'], start: '13:00', end: '14:15', location: '' },
          { days: ['Thu'], start: '13:00', end: '14:15', location: '' },
        ],
      },
    }),
    prisma.course.create({
      data: {
        userId: user.id,
        code: 'PHYS 201',
        name: 'Physics I',
        term: 'Winter 2026',
        credits: 4,
        colorTag: '#ef4444',
        meetingTimes: [
          { days: ['Mon'], start: '11:30', end: '12:45', location: '' },
          { days: ['Wed'], start: '11:30', end: '12:45', location: '' },
          { days: ['Fri'], start: '11:30', end: '12:20', location: '' },
        ],
      },
    }),
  ]);

  console.log('Created', courses.length, 'courses');

  const [cs, math, psych, engl, phys] = courses;
  const now = new Date();

  // Helper to create dates relative to today
  const daysFromNow = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 0, 0);
    return date;
  };

  // Create deadlines (assignments)
  const deadlines = await Promise.all([
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Problem Set 4: Binary Trees',
        courseId: cs.id,
        dueAt: daysFromNow(2),
        priority: 3,
        status: 'open',
        notes: 'Implement BST insert, delete, and traversal methods',
      },
    }),
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Matrix Operations Homework',
        courseId: math.id,
        dueAt: daysFromNow(4),
        priority: 2,
        status: 'open',
        notes: 'Chapter 3 problems: 1-15 odd',
      },
    }),
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Research Paper Draft',
        courseId: engl.id,
        dueAt: daysFromNow(7),
        priority: 3,
        status: 'open',
        notes: 'First draft of argumentative essay, 5-7 pages',
      },
    }),
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Lab Report: Projectile Motion',
        courseId: phys.id,
        dueAt: daysFromNow(3),
        priority: 2,
        status: 'open',
      },
    }),
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Case Study Analysis',
        courseId: psych.id,
        dueAt: daysFromNow(5),
        priority: 1,
        status: 'open',
        notes: 'Analyze the provided case study using concepts from Chapter 6',
      },
    }),
    prisma.deadline.create({
      data: {
        userId: user.id,
        title: 'Algorithm Analysis Report',
        courseId: cs.id,
        dueAt: daysFromNow(10),
        priority: 2,
        status: 'open',
      },
    }),
  ]);

  console.log('Created', deadlines.length, 'deadlines');

  // Create tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Review lecture notes for midterm',
        courseId: cs.id,
        dueAt: daysFromNow(5),
        importance: 'high',
        status: 'open',
        checklist: JSON.stringify([
          { text: 'Chapter 1-3 notes', done: true },
          { text: 'Chapter 4-6 notes', done: false },
          { text: 'Practice problems', done: false },
        ]),
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Office hours with Prof. Johnson',
        courseId: math.id,
        dueAt: daysFromNow(1),
        importance: 'medium',
        status: 'open',
        notes: 'Ask about eigenvalues problem from last homework',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Form study group for finals',
        dueAt: daysFromNow(14),
        importance: 'low',
        status: 'open',
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Read Chapter 7',
        courseId: psych.id,
        dueAt: daysFromNow(2),
        importance: 'medium',
        status: 'open',
      },
    }),
  ]);

  console.log('Created', tasks.length, 'tasks');

  // Create exams
  const exams = await Promise.all([
    prisma.exam.create({
      data: {
        userId: user.id,
        title: 'Midterm Exam',
        courseId: cs.id,
        examAt: daysFromNow(8),
        location: 'Room 204, Engineering Building',
        status: 'scheduled',
        notes: 'Covers Chapters 1-6, bring calculator',
      },
    }),
    prisma.exam.create({
      data: {
        userId: user.id,
        title: 'Quiz 3',
        courseId: math.id,
        examAt: daysFromNow(3),
        location: 'Regular classroom',
        status: 'scheduled',
        notes: 'Matrix multiplication and determinants',
      },
    }),
    prisma.exam.create({
      data: {
        userId: user.id,
        title: 'Midterm Exam',
        courseId: psych.id,
        examAt: daysFromNow(12),
        location: 'Lecture Hall A',
        status: 'scheduled',
      },
    }),
    prisma.exam.create({
      data: {
        userId: user.id,
        title: 'Lab Practical',
        courseId: phys.id,
        examAt: daysFromNow(6),
        location: 'Physics Lab 102',
        status: 'scheduled',
        notes: 'Hands-on equipment assessment',
      },
    }),
  ]);

  console.log('Created', exams.length, 'exams');

  // Create notes
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        userId: user.id,
        title: 'Binary Tree Notes',
        courseId: cs.id,
        plainText: 'Binary trees are hierarchical data structures where each node has at most two children...',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Binary Trees' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'A binary tree is a tree data structure where each node has at most two children, referred to as left and right child.' }] },
          ],
        }),
      },
    }),
    prisma.note.create({
      data: {
        userId: user.id,
        title: 'Linear Transformations',
        courseId: math.id,
        plainText: 'A linear transformation is a mapping between two vector spaces that preserves vector addition and scalar multiplication...',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Linear Transformations' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Key properties: T(u + v) = T(u) + T(v) and T(cu) = cT(u)' }] },
          ],
        }),
      },
    }),
    prisma.note.create({
      data: {
        userId: user.id,
        title: 'Memory & Learning',
        courseId: psych.id,
        plainText: 'The three stages of memory: encoding, storage, and retrieval...',
        content: JSON.stringify({
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Memory & Learning' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Three stages: encoding, storage, retrieval. Working memory vs long-term memory.' }] },
          ],
        }),
      },
    }),
  ]);

  console.log('Created', notes.length, 'notes');

  // Create GPA entries
  const gpaEntries = await Promise.all([
    prisma.gpaEntry.create({
      data: {
        userId: user.id,
        courseId: cs.id,
        courseName: 'Data Structures & Algorithms',
        credits: 4,
        grade: 'A-',
        term: 'Winter 2026',
      },
    }),
    prisma.gpaEntry.create({
      data: {
        userId: user.id,
        courseId: math.id,
        courseName: 'Linear Algebra',
        credits: 3,
        grade: 'B+',
        term: 'Winter 2026',
      },
    }),
    prisma.gpaEntry.create({
      data: {
        userId: user.id,
        courseName: 'Intro to Computer Science',
        credits: 4,
        grade: 'A',
        term: 'Fall 2025',
      },
    }),
    prisma.gpaEntry.create({
      data: {
        userId: user.id,
        courseName: 'Calculus II',
        credits: 4,
        grade: 'B',
        term: 'Fall 2025',
      },
    }),
    prisma.gpaEntry.create({
      data: {
        userId: user.id,
        courseName: 'English Composition',
        credits: 3,
        grade: 'A-',
        term: 'Fall 2025',
      },
    }),
  ]);

  console.log('Created', gpaEntries.length, 'GPA entries');

  console.log('\n✅ Demo account created!');
  console.log('Email: demo@collegeorbit.app');
  console.log('Password: demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
