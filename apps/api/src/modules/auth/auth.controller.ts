import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { AuthService } from './auth.service';
import type { RequestMeta } from './auth.types';

function extractRequestMeta(req: Request): RequestMeta {
  return {
    ipAddress: req.ip,
    userAgent: req.header('user-agent')?.slice(0, 250),
  };
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body, extractRequestMeta(req));
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body, extractRequestMeta(req));
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.refresh(req.body, extractRequestMeta(req));
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const result = await this.authService.logout(
        req.auth.userId,
        req.body.refreshToken,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.forgotPassword(req.body, extractRequestMeta(req));
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(req.body, extractRequestMeta(req));
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const sessions = await this.authService.listSessions(req.auth.userId);
      sendSuccess(res, { sessions }, 200);
    } catch (err) {
      next(err);
    }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const deviceId = req.params.deviceId as string;
      const result = await this.authService.revokeSession(
        req.auth.userId,
        deviceId,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const result = await this.authService.deleteAccount(
        req.auth.userId,
        req.body.password,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
