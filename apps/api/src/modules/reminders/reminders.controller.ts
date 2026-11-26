import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { RemindersService } from './reminders.service';

export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const reminders = await this.remindersService.list(req.auth.userId);
      sendSuccess(res, { reminders }, 200);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const reminder = await this.remindersService.create(req.auth.userId, req.body);
      sendSuccess(res, { reminder }, 201);
    } catch (err) {
      next(err);
    }
  };

  snooze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const reminder = await this.remindersService.snooze(
        req.auth.userId,
        req.params.id as string,
        req.body.snoozedUntil,
      );
      sendSuccess(res, { reminder }, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.remindersService.delete(req.auth.userId, req.params.id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
