import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info({ host: env.HOST, port: env.PORT, env: env.NODE_ENV }, 'LifeOS API server listening');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Received shutdown signal, closing API server');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while shutting down HTTP server');
      process.exit(1);
    }
    logger.info('HTTP server closed cleanly');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
