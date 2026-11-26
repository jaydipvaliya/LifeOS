import type { SubscriptionStatus } from '@lifeos/shared-types';
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { SubscriptionsService } from './subscriptions.service';

export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const status =
        typeof req.query.status === 'string' ? (req.query.status as SubscriptionStatus) : undefined;
      const result = await this.subscriptionsService.list(req.auth.userId, status);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const subscription = await this.subscriptionsService.create(req.auth.userId, req.body);
      sendSuccess(res, { subscription }, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const subscription = await this.subscriptionsService.update(
        req.auth.userId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { subscription }, 200);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const subscription = await this.subscriptionsService.cancel(
        req.auth.userId,
        req.params.id as string,
      );
      sendSuccess(res, { subscription }, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.subscriptionsService.delete(
        req.auth.userId,
        req.params.id as string,
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
