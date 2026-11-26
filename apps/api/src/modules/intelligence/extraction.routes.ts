import { confirmExtractionSchema, uuidSchema } from '@lifeos/validation';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { IAiProvider } from '../ai/ai-provider';
import { LocalOcrService } from '../ai/ocr-service';
import type { TokenService } from '../auth/token.service';
import type { IDocumentsRepository } from '../documents/documents.types';
import type { IStorageService } from '../storage/storage.types';
import { ExtractionService } from './extraction.service';
import type { IIntelligenceRepository } from './extraction.types';

const idParamsSchema = z.object({ id: uuidSchema });

export function createExtractionRouter(deps: {
  documentsRepository: IDocumentsRepository;
  intelligenceRepository: IIntelligenceRepository;
  storageService: IStorageService;
  aiProvider: IAiProvider;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const service = new ExtractionService(
    deps.documentsRepository,
    deps.intelligenceRepository,
    deps.storageService,
    new LocalOcrService(),
    deps.aiProvider,
  );
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);

  router.get(
    '/:id/extraction',
    validateRequest({ params: idParamsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const extraction = await service.getLatestExtraction(
          req.auth.userId,
          req.params.id as string,
        );
        sendSuccess(res, { extraction }, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:id/extraction/analyze',
    validateRequest({ params: idParamsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const extraction = await service.analyzeDocument(req.auth.userId, req.params.id as string);
        sendSuccess(res, { extraction }, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/:id/extraction/confirm',
    validateRequest({ params: idParamsSchema, body: confirmExtractionSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const result = await service.confirmExtraction(
          req.auth.userId,
          req.params.id as string,
          req.body,
          {
            ipAddress: req.ip,
            userAgent: req.header('user-agent')?.slice(0, 250),
          },
        );
        sendSuccess(res, result, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
