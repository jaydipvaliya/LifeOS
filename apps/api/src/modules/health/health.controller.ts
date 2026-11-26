import type { Request, Response } from 'express';
import { sendSuccess } from '../../shared/response';
import type { HealthService } from './health.service';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = (_req: Request, res: Response): void => {
    const status = this.healthService.getHealthStatus();
    sendSuccess(res, status);
  };
}
