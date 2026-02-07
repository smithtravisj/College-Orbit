import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function backfillMonthlyXp() {
  console.log('Backfilling MonthlyXpTotal from DailyActivity...\n');

  // Get all users with colleges
  const usersWithColleges = await prisma.user.findMany({
    where: { collegeId: { not: null } },
    select: { id: true, email: true, collegeId: true }
  });

  let created = 0;
  let updated = 0;

  for (const user of usersWithColleges) {
    if (!user.collegeId) continue;

    // Get all daily activity for this user
    const activities = await prisma.dailyActivity.findMany({
      where: { userId: user.id },
      select: { activityDate: true, xpEarned: true }
    });

    // Group by month
    const monthlyXp: Record<string, number> = {};
    for (const a of activities) {
      const yearMonth = `${a.activityDate.getUTCFullYear()}-${String(a.activityDate.getUTCMonth() + 1).padStart(2, '0')}`;
      monthlyXp[yearMonth] = (monthlyXp[yearMonth] || 0) + a.xpEarned;
    }

    // Upsert MonthlyXpTotal records
    for (const [yearMonth, totalXp] of Object.entries(monthlyXp)) {
      const existing = await prisma.monthlyXpTotal.findUnique({
        where: {
          userId_yearMonth: { userId: user.id, yearMonth }
        }
      });

      if (!existing) {
        await prisma.monthlyXpTotal.create({
          data: {
            userId: user.id,
            collegeId: user.collegeId,
            yearMonth,
            totalXp
          }
        });
        console.log(`Created: ${user.email} | ${yearMonth} | ${totalXp} XP`);
        created++;
      } else if (existing.totalXp !== totalXp || existing.collegeId !== user.collegeId) {
        await prisma.monthlyXpTotal.update({
          where: { id: existing.id },
          data: { totalXp, collegeId: user.collegeId }
        });
        console.log(`Updated: ${user.email} | ${yearMonth} | ${existing.totalXp} -> ${totalXp} XP`);
        updated++;
      }
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}`);
  await prisma.$disconnect();
}

backfillMonthlyXp().catch(console.error);
