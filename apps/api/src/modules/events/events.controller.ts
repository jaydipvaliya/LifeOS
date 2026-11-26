import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { EventsService } from './events.service';

export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const { events, pagination } = await this.eventsService.list(
        req.auth.userId,
        req.query as never,
      );
      sendSuccess(res, { events }, 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const event = await this.eventsService.create(req.auth.userId, req.body);
      sendSuccess(res, { event }, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const event = await this.eventsService.update(
        req.auth.userId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { event }, 200);
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const event = await this.eventsService.complete(req.auth.userId, req.params.id as string);
      sendSuccess(res, { event }, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.eventsService.delete(req.auth.userId, req.params.id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
