import type { DashboardDataDto } from '@lifeos/shared-types';
import type { IDashboardRepository } from './dashboard.types';

export class DashboardService {
  constructor(private readonly repository: IDashboardRepository) {}

  async getDashboard(userId: string): Promise<DashboardDataDto> {
    return this.repository.getDashboardData(userId);
  }
}
