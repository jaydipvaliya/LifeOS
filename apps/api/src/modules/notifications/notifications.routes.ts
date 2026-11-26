import { snoozeSchema, updateNotificationPreferenceSchema, uuidSchema } from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import type { INotificationsRepository } from './notifications.types';

const idParams = z.object({ id: uuidSchema });

export function createNotificationsRouter(deps: {
  repository: INotificationsRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new NotificationsService(deps.repository);
  const controller = new NotificationsController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/:id/read', validateRequest({ params: idParams }), controller.markAsRead);
  router.post(
    '/:id/snooze',
    validateRequest({ params: idParams, body: snoozeSchema }),
    controller.snooze,
  );
  router.get('/preferences', controller.getPreferences);
  router.patch(
    '/preferences',
    validateRequest({ body: updateNotificationPreferenceSchema }),
    controller.updatePreferences,
  );

  return router;
}
