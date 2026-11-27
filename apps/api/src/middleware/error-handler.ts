import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { captureApiException } from '../config/sentry';
import { AppError, NotFoundError } from '../shared/errors';
import { sendError } from '../shared/response';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = res.locals.requestId as string | undefined;

  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error({ err, requestId, path: req.originalUrl }, 'Operational server error');
      captureApiException(err, { requestId, path: req.originalUrl });
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  logger.error({ err, requestId, path: req.originalUrl }, 'Unhandled server error');
  captureApiException(err, { requestId, path: req.originalUrl });
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
}
