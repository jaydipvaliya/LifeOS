import { timingSafeEqual } from 'node:crypto';
import { confirmExtractionSchema, uuidSchema } from '@lifeos/validation';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
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

const internalExtractBodySchema = z.object({ userId: uuidSchema });

function hasValidWorkerSecret(headerValue: string | undefined, expectedSecret: string): boolean {
  if (!headerValue?.startsWith('Bearer ')) return false;
  const provided = Buffer.from(headerValue.slice('Bearer '.length).trim(), 'utf8');
  const expected = Buffer.from(expectedSecret, 'utf8');
  if (provided.length === 0 || provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(provided, expected);
}

/**
 * Internal worker callback endpoint for asynchronous BullMQ document OCR & AI extraction.
 */
export function createInternalExtractionRouter(deps: {
  documentsRepository: IDocumentsRepository;
  intelligenceRepository: IIntelligenceRepository;
  storageService: IStorageService;
  aiProvider: IAiProvider;
  workerSecret?: string;
}): Router {
  const router = Router();
  const service = new ExtractionService(
    deps.documentsRepository,
    deps.intelligenceRepository,
    deps.storageService,
    new LocalOcrService(),
    deps.aiProvider,
  );
  const expectedSecret =
    deps.workerSecret ?? env.INTERNAL_WORKER_SECRET ?? env.STORAGE_SIGNING_SECRET;

  router.post(
    '/:id/extract',
    validateRequest({ params: idParamsSchema, body: internalExtractBodySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!hasValidWorkerSecret(req.header('authorization'), expectedSecret)) {
          throw new UnauthorizedError('Invalid internal worker credential');
        }
        const extraction = await service.analyzeDocument(req.body.userId, req.params.id as string);
        sendSuccess(res, { extraction }, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
