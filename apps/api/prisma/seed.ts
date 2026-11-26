import 'dotenv/config';
import { DEFAULT_DOCUMENT_CATEGORIES } from '@lifeos/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const category of DEFAULT_DOCUMENT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        slug: category.slug,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          userId: null,
          slug: category.slug,
          name: category.name,
          isSystem: category.isSystem,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Failed to seed LifeOS database:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
