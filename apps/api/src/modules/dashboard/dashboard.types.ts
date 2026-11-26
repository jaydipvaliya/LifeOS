import type { DashboardDataDto } from '@lifeos/shared-types';

export interface IDashboardRepository {
  getDashboardData(userId: string): Promise<DashboardDataDto>;
}
