import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { CategoriesService } from './categories.service';

export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const categories = await this.categoriesService.listCategories(req.auth.userId);
      sendSuccess(res, { categories }, 200);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const category = await this.categoriesService.createCategory(req.auth.userId, req.body);
      sendSuccess(res, { category }, 201);
    } catch (err) {
      next(err);
    }
  };
}
