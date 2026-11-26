import { universalSearchQuerySchema } from '@lifeos/validation';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { TokenService } from '../auth/token.service';
import type { IIntelligenceRepository } from './extraction.types';

export function createSearchRouter(deps: {
  intelligenceRepository: IIntelligenceRepository;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);

  router.get(
    '/',
    validateRequest({ query: universalSearchQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const { q, limit } = req.query as unknown as { q: string; limit: number };
        const result = await deps.intelligenceRepository.universalSearch(
          req.auth.userId,
          q,
          Number(limit) || 8,
        );
        sendSuccess(res, result, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
