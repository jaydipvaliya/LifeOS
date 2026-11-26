import pino from 'pino';
import { workerEnv } from './env';

export const logger = pino({
  level: workerEnv.NODE_ENV === 'test' ? 'silent' : workerEnv.LOG_LEVEL,
  transport:
    workerEnv.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
