import { prisma } from '@/lib/prisma';

export async function seedDemoData(userId: string) {
  const now = new Date();
  const addDays = (d: Date, days: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    result.setHours(23, 59, 0, 0);
    return result;
  };

  const demoCourses = await Promise.all([
    prisma.course.create({
      data: {
        userId,
        code: 'CS 201',
        name: 'Data Structures',
        term: 'Winter 2026',
        colorTag: 'blue',
        meetingTimes: [{ days: ['Mon', 'Wed', 'Fri'], start: '10:00', end: '10:50', location: '' }],
      },
    }),
    prisma.course.create({
      data: {
        userId,
        code: 'MATH 215',
        name: 'Linear Algebra',
        term: 'Winter 2026',
        colorTag: 'purple',
        meetingTimes: [{ days: ['Tue', 'Thu'], start: '13:00', end: '14:15', location: '' }],
      },
    }),
    prisma.course.create({
      data: {
        userId,
        code: 'ENGL 101',
        name: 'Academic Writing',
        term: 'Winter 2026',
        colorTag: 'green',
        meetingTimes: [{ days: ['Mon', 'Wed', 'Fri'], start: '14:00', end: '14:50', location: '' }],
      },
    }),
  ]);

  const [cs201, math215, engl101] = demoCourses;

  await Promise.all([
    prisma.workItem.create({ data: { userId, title: 'Linked List Implementation', type: 'assignment', courseId: cs201.id, dueAt: addDays(now, 3), priority: 'medium', tags: ['demo'] } }),
    prisma.workItem.create({ data: { userId, title: 'Chapter 5 Reading', type: 'reading', courseId: math215.id, dueAt: addDays(now, 1), priority: 'low', tags: ['demo'] } }),
    prisma.workItem.create({ data: { userId, title: 'Essay Draft 1', type: 'assignment', courseId: engl101.id, dueAt: addDays(now, 5), priority: 'high', tags: ['demo'] } }),
    prisma.workItem.create({ data: { userId, title: 'Review lecture notes', type: 'task', courseId: cs201.id, dueAt: addDays(now, 2), priority: 'low', tags: ['demo'] } }),
    prisma.workItem.create({ data: { userId, title: 'Study for quiz', type: 'task', courseId: math215.id, dueAt: addDays(now, 4), priority: 'medium', tags: ['demo'] } }),
    prisma.exam.create({ data: { userId, title: 'Midterm 1', courseId: math215.id, examAt: addDays(now, 10), location: 'Testing Center Room 204', tags: ['demo'] } }),
  ]);

  await prisma.settings.update({ where: { userId }, data: { hasDemoData: true } });
  console.log('Demo data created for user:', userId);
}
