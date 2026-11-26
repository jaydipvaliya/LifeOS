import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { TasksService } from './tasks.service';

export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const { tasks, pagination } = await this.tasksService.list(
        req.auth.userId,
        req.query as never,
      );
      sendSuccess(res, { tasks }, 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const task = await this.tasksService.create(req.auth.userId, req.body);
      sendSuccess(res, { task }, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const task = await this.tasksService.update(
        req.auth.userId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { task }, 200);
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const task = await this.tasksService.complete(req.auth.userId, req.params.id as string);
      sendSuccess(res, { task }, 200);
    } catch (err) {
      next(err);
    }
  };

  snooze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const task = await this.tasksService.snooze(
        req.auth.userId,
        req.params.id as string,
        req.body.snoozedUntil,
      );
      sendSuccess(res, { task }, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.tasksService.delete(req.auth.userId, req.params.id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
