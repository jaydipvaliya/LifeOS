import { updateProfileSchema } from '@lifeos/validation';
import { Router } from 'express';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import type { IUsersRepository } from './users.types';

export function createUsersRouter(deps: {
  repository: IUsersRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const usersService = new UsersService(deps.repository);
  const controller = new UsersController(usersService);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/me', controller.getMe);
  router.patch(
    '/me/profile',
    validateRequest({ body: updateProfileSchema }),
    controller.updateMyProfile,
  );

  return router;
}
