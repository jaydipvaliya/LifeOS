import {
  documentListQuerySchema,
  documentUploadCompleteSchema,
  documentUploadInitSchema,
  updateDocumentSchema,
  uuidSchema,
} from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import type { TokenService } from '../auth/token.service';
import type { ICategoriesRepository } from '../categories/categories.types';
import type { IExtractionQueue } from '../intelligence/extraction.queue';
import type { IStorageService } from '../storage/storage.types';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import type { IDocumentsRepository } from './documents.types';

const idParamsSchema = z.object({ id: uuidSchema });

export function createDocumentsRouter(deps: {
  documentsRepository: IDocumentsRepository;
  categoriesRepository: ICategoriesRepository;
  storageService: IStorageService;
  tokenService: TokenService;
  extractionQueue?: IExtractionQueue;
}): Router {
  const router = Router();
  const service = new DocumentsService(
    deps.documentsRepository,
    deps.categoriesRepository,
    deps.storageService,
    deps.extractionQueue,
  );
  const controller = new DocumentsController(service);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);

  router.get('/', validateRequest({ query: documentListQuerySchema }), controller.list);
  router.post(
    '/upload-init',
    validateRequest({ body: documentUploadInitSchema }),
    controller.initiateUpload,
  );
  router.post(
    '/:id/upload-complete',
    validateRequest({ params: idParamsSchema, body: documentUploadCompleteSchema }),
    controller.completeUpload,
  );
  router.get('/:id', validateRequest({ params: idParamsSchema }), controller.getDetail);
  router.patch(
    '/:id',
    validateRequest({ params: idParamsSchema, body: updateDocumentSchema }),
    controller.updateMetadata,
  );
  router.post('/:id/archive', validateRequest({ params: idParamsSchema }), controller.archive);
  router.post('/:id/restore', validateRequest({ params: idParamsSchema }), controller.restore);
  router.delete('/:id', validateRequest({ params: idParamsSchema }), controller.delete);
  router.get(
    '/:id/download-url',
    validateRequest({ params: idParamsSchema }),
    controller.getDownloadUrl,
  );

  return router;
}
