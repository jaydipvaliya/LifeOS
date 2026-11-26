export interface CategoryRecord {
  id: string;
  userId: string | null;
  slug: string;
  name: string;
  isSystem: boolean;
  iconName: string | null;
  documentCount: number;
}

export interface ICategoriesRepository {
  listForUser(userId: string): Promise<CategoryRecord[]>;
  findAccessibleById(categoryId: string, userId: string): Promise<CategoryRecord | null>;
  createCustomCategory(params: {
    userId: string;
    slug: string;
    name: string;
    iconName?: string | null;
  }): Promise<CategoryRecord>;
}
