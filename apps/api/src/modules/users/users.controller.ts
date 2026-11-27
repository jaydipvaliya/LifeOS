import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { UsersService } from './users.service';

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const result = await this.usersService.getMe(req.auth.userId);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const result = await this.usersService.updateMyProfile(req.auth.userId, req.body);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  registerPushToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError();
      }
      const result = await this.usersService.registerPushToken(
        req.auth.userId,
        req.body.pushToken,
        req.body.deviceId ?? req.auth.deviceId ?? undefined,
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
