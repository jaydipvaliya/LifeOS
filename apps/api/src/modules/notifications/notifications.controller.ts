import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { NotificationsService } from './notifications.service';

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const notifications = await this.notificationsService.list(req.auth.userId);
      sendSuccess(res, { notifications }, 200);
    } catch (err) {
      next(err);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const notification = await this.notificationsService.markAsRead(
        req.auth.userId,
        req.params.id as string,
      );
      sendSuccess(res, { notification }, 200);
    } catch (err) {
      next(err);
    }
  };

  snooze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const notification = await this.notificationsService.snooze(
        req.auth.userId,
        req.params.id as string,
        req.body.snoozedUntil,
      );
      sendSuccess(res, { notification }, 200);
    } catch (err) {
      next(err);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const preferences = await this.notificationsService.getPreferences(req.auth.userId);
      sendSuccess(res, { preferences }, 200);
    } catch (err) {
      next(err);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const preferences = await this.notificationsService.updatePreferences(
        req.auth.userId,
        req.body,
      );
      sendSuccess(res, { preferences }, 200);
    } catch (err) {
      next(err);
    }
  };
}
