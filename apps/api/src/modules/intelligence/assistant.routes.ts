import { askAssistantSchema, uuidSchema } from '@lifeos/validation';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { NotFoundError, UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { IAiProvider } from '../ai/ai-provider';
import type { TokenService } from '../auth/token.service';
import type { IIntelligenceRepository } from './extraction.types';

const convIdParamsSchema = z.object({ id: uuidSchema });

export function createAssistantRouter(deps: {
  intelligenceRepository: IIntelligenceRepository;
  aiProvider: IAiProvider;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const requireAuth = createRequireAuth(deps.tokenService);

  router.use(requireAuth);

  router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const conversations = await deps.intelligenceRepository.listConversations(req.auth.userId);
      sendSuccess(res, { conversations }, 200);
    } catch (err) {
      next(err);
    }
  });

  router.get(
    '/conversations/:id',
    validateRequest({ params: convIdParamsSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const conversation = await deps.intelligenceRepository.getConversationDetail(
          req.auth.userId,
          req.params.id as string,
        );
        if (!conversation) {
          throw new NotFoundError('Conversation not found');
        }
        sendSuccess(res, { conversation }, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    '/ask',
    validateRequest({ body: askAssistantSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) throw new UnauthorizedError();
        const { conversationId, question, documentId } = req.body as {
          conversationId?: string | null;
          question: string;
          documentId?: string | null;
        };

        const existingHistory = conversationId
          ? ((
              await deps.intelligenceRepository.getConversationDetail(
                req.auth.userId,
                conversationId,
              )
            )?.messages.map((m) => ({ role: m.role, content: m.content })) ?? [])
          : [];

        const contextItems = await deps.intelligenceRepository.gatherAssistantContext(
          req.auth.userId,
          documentId,
        );

        const aiResult = await deps.aiProvider.answerLifeQuestion({
          question,
          contextItems,
          history: existingHistory,
        });

        const turn = await deps.intelligenceRepository.appendConversationTurn({
          userId: req.auth.userId,
          conversationId,
          question,
          answer: aiResult.answer,
          citations: aiResult.citations,
        });

        sendSuccess(res, turn, 200);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
