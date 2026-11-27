import { Router } from 'express';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

export function createHealthRouter(): Router {
  const router = Router();
  const service = new HealthService();
  const controller = new HealthController(service);

  router.get('/', controller.getHealth);
  router.get('/ready', controller.getReadiness);

  return router;
}
