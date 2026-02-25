import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix existing versions: ensure all changes arrays contain strings, not objects
  const allVersions = await prisma.appVersion.findMany();
  for (const ver of allVersions) {
    const changes = ver.changes as unknown[];
    if (Array.isArray(changes) && changes.some((c) => typeof c !== 'string')) {
      const fixed = changes.map((c) => (typeof c === 'string' ? c : JSON.stringify(c)));
      await prisma.appVersion.update({
        where: { id: ver.id },
        data: { changes: fixed },
      });
      console.log(`Fixed changes for ${ver.version} (converted objects to strings)`);
    }

    // Ensure version has "v" prefix
    if (!ver.version.startsWith('v')) {
      await prisma.appVersion.update({
        where: { id: ver.id },
        data: { version: `v${ver.version}` },
      });
      console.log(`Added "v" prefix to ${ver.version} -> v${ver.version}`);
    }
  }

  // Add v1.4.2
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.2' },
    update: {
      changes: [
        'Buttons and tabs auto-switch between black/white text based on accent color brightness',
        'Solid panel backgrounds for modals and toasts to prevent transparency bleed-through',
        'Active tab text now uses accent-aware contrast color across all pages',
        'Fix AI chat creating duplicate items instead of updating existing ones',
      ],
    },
    create: {
      version: 'v1.4.2',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Buttons and tabs auto-switch between black/white text based on accent color brightness',
        'Solid panel backgrounds for modals and toasts to prevent transparency bleed-through',
        'Active tab text now uses accent-aware contrast color across all pages',
        'Fix AI chat creating duplicate items instead of updating existing ones',
      ],
    },
  });

  console.log('Created version:', version);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
