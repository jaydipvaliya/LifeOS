import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequestError } from '../shared/errors';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const details: Array<{ field: string; message: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            field: ['body', ...issue.path].join('.'),
            message: issue.message,
          });
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            field: ['query', ...issue.path].join('.'),
            message: issue.message,
          });
        }
      } else {
        req.query = result.data as Request['query'];
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          details.push({
            field: ['params', ...issue.path].join('.'),
            message: issue.message,
          });
        }
      } else {
        req.params = result.data as Request['params'];
      }
    }

    if (details.length > 0) {
      next(new BadRequestError('Request validation failed', details));
      return;
    }

    next();
  };
}
