import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const dashboard = await this.dashboardService.getDashboard(req.auth.userId);
      sendSuccess(res, dashboard, 200);
    } catch (err) {
      next(err);
    }
  };
}
