import { PrismaClient } from '@prisma/client';
import releases from '../data/releases.json';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting release migration...');

  // Check if migration already done
  const existingVersions = await prisma.appVersion.count();
  if (existingVersions > 0) {
    console.log(`Migration already completed. Found ${existingVersions} existing versions.`);
    return;
  }

  // Import all releases from releases.json
  let importedCount = 0;
  for (const release of releases.releases) {
    const [year, month, day] = release.date.split('-').map(Number);
    const releasedAt = new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid timezone issues

    await prisma.appVersion.create({
      data: {
        version: release.version,
        changes: release.changes,
        isBetaOnly: false, // All existing releases are already public
        releasedAt,
      },
    });
    importedCount++;
    console.log(`Imported v${release.version}`);
  }

  console.log(`\nMigration completed. Imported ${importedCount} versions.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
