import { DEFAULT_DOCUMENT_CATEGORIES } from '@lifeos/config';
import type { PrismaClient } from '@prisma/client';
import { ConflictError } from '../../shared/errors';
import type { CategoryRecord, ICategoriesRepository } from './categories.types';

export class PrismaCategoriesRepository implements ICategoriesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async ensureSystemCategories(): Promise<void> {
    const existingCount = await this.prisma.category.count({
      where: { userId: null, isSystem: true },
    });
    if (existingCount > 0) {
      return;
    }

    for (const category of DEFAULT_DOCUMENT_CATEGORIES) {
      const exists = await this.prisma.category.findFirst({
        where: { userId: null, slug: category.slug },
      });
      if (!exists) {
        await this.prisma.category.create({
          data: {
            userId: null,
            slug: category.slug,
            name: category.name,
            isSystem: true,
          },
        });
      }
    }
  }

  async listForUser(userId: string): Promise<CategoryRecord[]> {
    await this.ensureSystemCategories();

    const rows = await this.prisma.category.findMany({
      where: {
        OR: [{ userId: null, isSystem: true }, { userId }],
      },
      include: {
        _count: {
          select: {
            documents: {
              where: { userId, deletedAt: null, isArchived: false },
            },
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      slug: row.slug,
      name: row.name,
      isSystem: row.isSystem,
      iconName: row.iconName,
      documentCount: row._count.documents,
    }));
  }

  async findAccessibleById(categoryId: string, userId: string): Promise<CategoryRecord | null> {
    await this.ensureSystemCategories();

    const row = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: null, isSystem: true }, { userId }],
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      slug: row.slug,
      name: row.name,
      isSystem: row.isSystem,
      iconName: row.iconName,
      documentCount: 0,
    };
  }

  async createCustomCategory(params: {
    userId: string;
    slug: string;
    name: string;
    iconName?: string | null;
  }): Promise<CategoryRecord> {
    await this.ensureSystemCategories();

    const duplicate = await this.prisma.category.findFirst({
      where: {
        slug: params.slug,
        OR: [{ userId: null, isSystem: true }, { userId: params.userId }],
      },
    });
    if (duplicate) {
      throw new ConflictError('A category with this name already exists');
    }

    const created = await this.prisma.category.create({
      data: {
        userId: params.userId,
        slug: params.slug,
        name: params.name,
        isSystem: false,
        iconName: params.iconName ?? null,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      slug: created.slug,
      name: created.name,
      isSystem: created.isSystem,
      iconName: created.iconName,
      documentCount: 0,
    };
  }
}
