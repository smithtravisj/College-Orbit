import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add v1.4.4
  const version = await prisma.appVersion.upsert({
    where: { version: 'v1.4.4' },
    update: {
      changes: [
        'Compress images, PDFs, and Office files (PPTX, DOCX, XLSX) in the File Converter',
        'Three compression levels: Max Compression, Balanced, Light Compression',
      ],
    },
    create: {
      version: 'v1.4.4',
      isBetaOnly: false,
      releasedAt: new Date(),
      changes: [
        'Compress images, PDFs, and Office files (PPTX, DOCX, XLSX) in the File Converter',
        'Three compression levels: Max Compression, Balanced, Light Compression',
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
