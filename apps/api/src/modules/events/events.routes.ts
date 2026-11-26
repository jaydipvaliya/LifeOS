import {
  createEventSchema,
  eventListQuerySchema,
  updateEventSchema,
  uuidSchema,
} from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import type { IEventsRepository } from './events.types';

const idParams = z.object({ id: uuidSchema });

export function createEventsRouter(deps: {
  repository: IEventsRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new EventsService(deps.repository);
  const controller = new EventsController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', validateRequest({ query: eventListQuerySchema }), controller.list);
  router.post('/', validateRequest({ body: createEventSchema }), controller.create);
  router.patch(
    '/:id',
    validateRequest({ params: idParams, body: updateEventSchema }),
    controller.update,
  );
  router.post('/:id/complete', validateRequest({ params: idParams }), controller.complete);
  router.delete('/:id', validateRequest({ params: idParams }), controller.delete);

  return router;
}
