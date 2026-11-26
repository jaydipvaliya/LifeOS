import { createReminderSchema, snoozeSchema, uuidSchema } from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import type { IReminderQueue } from './reminder-queue';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import type { IRemindersRepository } from './reminders.types';

const idParams = z.object({ id: uuidSchema });

export function createRemindersRouter(deps: {
  repository: IRemindersRepository;
  queue: IReminderQueue;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new RemindersService(deps.repository, deps.queue);
  const controller = new RemindersController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/', validateRequest({ body: createReminderSchema }), controller.create);
  router.post(
    '/:id/snooze',
    validateRequest({ params: idParams, body: snoozeSchema }),
    controller.snooze,
  );
  router.delete('/:id', validateRequest({ params: idParams }), controller.delete);

  return router;
}
