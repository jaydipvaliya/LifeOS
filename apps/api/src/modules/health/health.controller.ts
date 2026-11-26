import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/response';
import type { HealthService } from './health.service';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.healthService.getHealthStatus();
      sendSuccess(res, status);
    } catch (err) {
      next(err);
    }
  };
}
