import { syncBatchSchema } from '@lifeos/validation';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { TokenService } from '../auth/token.service';
import type { IIntelligenceRepository } from './extraction.types';

export function createSyncRouter(deps: {
  intelligenceRepository: IIntelligenceRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);

  router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const pendingOrConflictCount = await deps.intelligenceRepository.getPendingSyncCount(
        req.auth.userId,
      );
      sendSuccess(
        res,
        {
          serverTime: new Date().toISOString(),
          pendingOrConflictCount,
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/batch',
    validateRequest({ body: syncBatchSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const { deviceId, operations } = req.body;
        const results = await deps.intelligenceRepository.processSyncBatch({
          userId: req.auth.userId,
          deviceId: deviceId ?? null,
          operations,
        });
        sendSuccess(
          res,
          {
            processedAt: new Date().toISOString(),
            results,
          },
          200,
        );
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
