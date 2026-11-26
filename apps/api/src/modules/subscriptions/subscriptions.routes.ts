import { createSubscriptionSchema, updateSubscriptionSchema, uuidSchema } from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import type { ISubscriptionsRepository } from './subscriptions.types';

const idParams = z.object({ id: uuidSchema });

export function createSubscriptionsRouter(deps: {
  repository: ISubscriptionsRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new SubscriptionsService(deps.repository);
  const controller = new SubscriptionsController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/', validateRequest({ body: createSubscriptionSchema }), controller.create);
  router.patch(
    '/:id',
    validateRequest({ params: idParams, body: updateSubscriptionSchema }),
    controller.update,
  );
  router.post('/:id/cancel', validateRequest({ params: idParams }), controller.cancel);
  router.delete('/:id', validateRequest({ params: idParams }), controller.delete);

  return router;
}
