import {
  createTaskSchema,
  snoozeSchema,
  taskListQuerySchema,
  updateTaskSchema,
  uuidSchema,
} from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import type { ITasksRepository } from './tasks.types';

const idParams = z.object({ id: uuidSchema });

export function createTasksRouter(deps: {
  repository: ITasksRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new TasksService(deps.repository);
  const controller = new TasksController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', validateRequest({ query: taskListQuerySchema }), controller.list);
  router.post('/', validateRequest({ body: createTaskSchema }), controller.create);
  router.patch(
    '/:id',
    validateRequest({ params: idParams, body: updateTaskSchema }),
    controller.update,
  );
  router.post('/:id/complete', validateRequest({ params: idParams }), controller.complete);
  router.post(
    '/:id/snooze',
    validateRequest({ params: idParams, body: snoozeSchema }),
    controller.snooze,
  );
  router.delete('/:id', validateRequest({ params: idParams }), controller.delete);

  return router;
}
