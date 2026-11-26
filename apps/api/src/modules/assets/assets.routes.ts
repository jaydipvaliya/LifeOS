import {
  createAssetRepairSchema,
  createAssetSchema,
  linkAssetDocumentSchema,
  updateAssetSchema,
  uuidSchema,
} from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import type { IAssetsRepository } from './assets.types';

const idParams = z.object({ id: uuidSchema });

export function createAssetsRouter(deps: {
  repository: IAssetsRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new AssetsService(deps.repository);
  const controller = new AssetsController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);
  router.get('/', controller.list);
  router.post('/', validateRequest({ body: createAssetSchema }), controller.create);
  router.get('/:id', validateRequest({ params: idParams }), controller.getDetail);
  router.patch(
    '/:id',
    validateRequest({ params: idParams, body: updateAssetSchema }),
    controller.update,
  );
  router.post(
    '/:id/documents',
    validateRequest({ params: idParams, body: linkAssetDocumentSchema }),
    controller.linkDocument,
  );
  router.post(
    '/:id/repairs',
    validateRequest({ params: idParams, body: createAssetRepairSchema }),
    controller.addRepair,
  );
  router.delete('/:id', validateRequest({ params: idParams }), controller.delete);

  return router;
}
