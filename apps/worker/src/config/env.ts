import 'dotenv/config';
import { z } from 'zod';

const workerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  API_INTERNAL_URL: z.string().optional(),
  INTERNAL_WORKER_SECRET: z.string().optional(),
  AI_PROVIDER: z.enum(['none', 'openai', 'gemini']).default('none'),
  AI_API_KEY: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

const parsed = workerEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid worker environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid worker environment configuration');
}

export const workerEnv = parsed.data;
