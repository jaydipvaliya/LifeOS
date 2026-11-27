import * as Sentry from '@sentry/node';
import { env } from './env';
import { logger } from './logger';

let initialized = false;

export function initApiSentry(): void {
  if (initialized || !env.SENTRY_DSN || env.NODE_ENV === 'test') {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
  initialized = true;
  logger.info('Sentry error monitoring initialized for API');
}

export function captureApiException(
  err: unknown,
  context?: { requestId?: string; path?: string },
): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context?.requestId) scope.setTag('requestId', context.requestId);
    if (context?.path) scope.setTag('path', context.path);
    Sentry.captureException(err);
  });
}
