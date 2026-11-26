import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';
import type { RequestMeta } from '../auth/auth.types';
import type { DocumentsService } from './documents.service';

function extractRequestMeta(req: Request): RequestMeta {
  return {
    ipAddress: req.ip,
    userAgent: req.header('user-agent')?.slice(0, 250),
  };
}

export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  initiateUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const result = await this.documentsService.initiateUpload(
        req.auth.userId,
        req.body,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  completeUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const result = await this.documentsService.completeUpload(
        req.auth.userId,
        documentId,
        req.body,
        extractRequestMeta(req),
      );
      sendSuccess(res, { document: result }, 200);
    } catch (err) {
      next(err);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const { documents, pagination } = await this.documentsService.listDocuments(
        req.auth.userId,
        req.query as never,
      );
      sendSuccess(res, { documents }, 200, pagination);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const document = await this.documentsService.getDocumentDetail(req.auth.userId, documentId);
      sendSuccess(res, { document }, 200);
    } catch (err) {
      next(err);
    }
  };

  updateMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const document = await this.documentsService.updateMetadata(
        req.auth.userId,
        documentId,
        req.body,
        extractRequestMeta(req),
      );
      sendSuccess(res, { document }, 200);
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const document = await this.documentsService.archiveDocument(
        req.auth.userId,
        documentId,
        extractRequestMeta(req),
      );
      sendSuccess(res, { document }, 200);
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const document = await this.documentsService.restoreDocument(
        req.auth.userId,
        documentId,
        extractRequestMeta(req),
      );
      sendSuccess(res, { document }, 200);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const result = await this.documentsService.deleteDocument(
        req.auth.userId,
        documentId,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };

  getDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.auth) throw new UnauthorizedError();
      const documentId = req.params.id as string;
      const result = await this.documentsService.getSignedDownloadUrl(
        req.auth.userId,
        documentId,
        extractRequestMeta(req),
      );
      sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  };
}
