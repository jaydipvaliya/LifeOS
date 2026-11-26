import { API_PREFIX } from '@lifeos/config';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { openApiSpec } from './config/openapi';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limit';
import { requestIdMiddleware } from './middleware/request-id';
import { createHealthRouter } from './modules/health/health.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (_req, res) => ({
        requestId: res.locals.requestId,
      }),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(apiRateLimiter);

  app.use(`${API_PREFIX}/health`, createHealthRouter());
  app.get(`${API_PREFIX}/docs/openapi.json`, (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
