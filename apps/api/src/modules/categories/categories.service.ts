import type { CategoryDto } from '@lifeos/shared-types';
import type { CreateCategoryInput } from '@lifeos/validation';
import type { CategoryRecord, ICategoriesRepository } from './categories.types';

function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function toCategoryDto(record: CategoryRecord): CategoryDto {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    isSystem: record.isSystem,
    iconName: record.iconName,
    documentCount: record.documentCount,
  };
}

export class CategoriesService {
  constructor(private readonly repository: ICategoriesRepository) {}

  async listCategories(userId: string): Promise<CategoryDto[]> {
    const categories = await this.repository.listForUser(userId);
    return categories.map(toCategoryDto);
  }

  async createCategory(userId: string, input: CreateCategoryInput): Promise<CategoryDto> {
    const slug = slugifyCategoryName(input.name) || `category-${Date.now()}`;
    const created = await this.repository.createCustomCategory({
      userId,
      slug,
      name: input.name,
      iconName: input.iconName ?? null,
    });
    return toCategoryDto(created);
  }
}
