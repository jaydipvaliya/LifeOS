import { createCategorySchema } from '@lifeos/validation';
import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import type { ICategoriesRepository } from './categories.types';

export function createCategoriesRouter(deps: {
  repository: ICategoriesRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new CategoriesService(deps.repository);
  const controller = new CategoriesController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/', validateRequest({ body: createCategorySchema }), controller.create);

  return router;
}
