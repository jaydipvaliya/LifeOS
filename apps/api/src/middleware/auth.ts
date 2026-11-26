import type { NextFunction, Request, Response } from 'express';
import { TokenService } from '../modules/auth/token.service';
import { UnauthorizedError } from '../shared/errors';

export interface AuthenticatedContext {
  userId: string;
  email: string;
  deviceId: string | null;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthenticatedContext;
  }
}

export function createRequireAuth(tokenService = new TokenService()) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new UnauthorizedError('Missing or invalid Authorization header'));
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      next(new UnauthorizedError('Access token is required'));
      return;
    }

    try {
      const payload = tokenService.verifyAccessToken(token);
      req.auth = {
        userId: payload.userId,
        email: payload.email,
        deviceId: payload.deviceId,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}
