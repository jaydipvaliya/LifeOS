import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { disconnectPrisma } from './config/prisma';
import { captureApiException, initApiSentry } from './config/sentry';

initApiSentry();
const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info({ host: env.HOST, port: env.PORT, env: env.NODE_ENV }, 'LifeOS API server listening');
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal, closing API server');

  const forceTimer = setTimeout(() => {
    logger.error('Forced shutdown after 10s grace period expired');
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error while shutting down HTTP server');
      process.exit(1);
    }
    try {
      await disconnectPrisma();
      logger.info('HTTP server and Prisma client closed cleanly');
      process.exit(0);
    } catch (prismaErr) {
      logger.error({ err: prismaErr }, 'Error disconnecting Prisma client');
      process.exit(1);
    }
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Promise Rejection in API process');
  captureApiException(reason, { path: 'process.unhandledRejection' });
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception in API process');
  captureApiException(err, { path: 'process.uncaughtException' });
  shutdown('uncaughtException');
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
