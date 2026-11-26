import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth';
import type { TokenService } from '../auth/token.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import type { IDashboardRepository } from './dashboard.types';

export function createDashboardRouter(deps: {
  repository: IDashboardRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new DashboardService(deps.repository);
  const controller = new DashboardController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.getDashboard);

  return router;
}
