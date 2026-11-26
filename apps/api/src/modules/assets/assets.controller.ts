import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { AssetsService } from './assets.service';

export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const assets = await this.assetsService.list(req.auth.userId, search);
      sendSuccess(res, { assets }, 200);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const asset = await this.assetsService.getDetail(req.auth.userId, req.params.id as string);
      sendSuccess(res, { asset }, 200);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const asset = await this.assetsService.create(req.auth.userId, req.body);
      sendSuccess(res, { asset }, 201);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const asset = await this.assetsService.update(
        req.auth.userId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { asset }, 200);
    } catch (err) {
      next(err);
    }
  };

  linkDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const asset = await this.assetsService.linkDocument(
        req.auth.userId,
        req.params.id as string,
        req.body.documentId,
        req.body.relationType,
      );
      sendSuccess(res, { asset }, 200);
    } catch (err) {
      next(err);
    }
  };

  addRepair = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const repair = await this.assetsService.addRepair(
        req.auth.userId,
        req.params.id as string,
        req.body,
      );
      sendSuccess(res, { repair }, 201);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.assetsService.delete(req.auth.userId, req.params.id as string);
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
