import type { Response } from 'express';
import type {
  ApiErrorDetail,
  ApiErrorResponse,
  ApiSuccessResponse,
  PaginationMeta,
} from '@lifeos/shared-types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta,
): Response<ApiSuccessResponse<T>> {
  const requestId = (res.locals.requestId as string | undefined) ?? 'unknown';
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...(pagination ? { pagination } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
): Response<ApiErrorResponse> {
  const requestId = (res.locals.requestId as string | undefined) ?? 'unknown';
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}
