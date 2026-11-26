import type { ApiErrorDetail } from '@lifeos/shared-types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    details?: ApiErrorDetail[];
    isOperational?: boolean;
  }) {
    super(options.message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request', details?: ApiErrorDetail[]) {
    super({ message, statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super({ message, statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super({ message, statusCode: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({ message, statusCode: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super({ message, statusCode: 409, code: 'CONFLICT' });
  }
}
