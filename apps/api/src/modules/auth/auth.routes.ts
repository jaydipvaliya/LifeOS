import {
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  uuidSchema,
} from '@lifeos/validation';
import { Router } from 'express';
import { z } from 'zod';
import { createRequireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limit';
import { validateRequest } from '../../middleware/validate';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { IAuthRepository } from './auth.types';
import type { PasswordService } from './password.service';
import type { TokenService } from './token.service';

export function createAuthRouter(deps: {
  repository: IAuthRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
}): Router {
  const router = Router();
  const authService = new AuthService(deps.repository, deps.passwordService, deps.tokenService);
  const controller = new AuthController(authService);
  const requireAuth = createRequireAuth(deps.tokenService);

  router.post(
    '/register',
    authRateLimiter,
    validateRequest({ body: registerSchema }),
    controller.register,
  );
  router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), controller.login);
  router.post(
    '/refresh',
    authRateLimiter,
    validateRequest({ body: refreshTokenSchema }),
    controller.refresh,
  );
  router.post(
    '/forgot-password',
    authRateLimiter,
    validateRequest({ body: forgotPasswordSchema }),
    controller.forgotPassword,
  );
  router.post(
    '/reset-password',
    authRateLimiter,
    validateRequest({ body: resetPasswordSchema }),
    controller.resetPassword,
  );

  router.post('/logout', requireAuth, validateRequest({ body: logoutSchema }), controller.logout);
  router.get('/sessions', requireAuth, controller.listSessions);
  router.delete(
    '/sessions/:deviceId',
    requireAuth,
    validateRequest({ params: z.object({ deviceId: uuidSchema }) }),
    controller.revokeSession,
  );
  router.delete(
    '/account',
    requireAuth,
    validateRequest({ body: deleteAccountSchema }),
    controller.deleteAccount,
  );

  return router;
}
