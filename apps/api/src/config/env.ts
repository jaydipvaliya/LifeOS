import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().default('0.0.0.0'),
    CORS_ORIGIN: z.string().default('http://localhost:8081'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    PUBLIC_API_BASE_URL: z
      .string()
      .default(process.env.RENDER_EXTERNAL_URL || 'http://127.0.0.1:4000'),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().optional(),
    RUN_EMBEDDED_WORKER: z.coerce.boolean().default(false),
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('.storage'),
    STORAGE_SIGNING_SECRET: z.string().default('lifeos-dev-only-storage-signing-secret-32c'),
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().default('ap-south-1'),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
    JWT_ACCESS_SECRET: z.string().default('lifeos-dev-only-access-secret-change-in-prod-32c'),
    JWT_REFRESH_SECRET: z.string().default('lifeos-dev-only-refresh-secret-change-in-prod-32c'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().min(1).max(90).default(30),
    AI_PROVIDER: z.enum(['none', 'openai', 'gemini']).default('none'),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    AI_BASE_URL: z.string().optional(),
    EMAIL_PROVIDER: z.enum(['none', 'resend']).default('none'),
    EMAIL_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('LifeOS <noreply@lifeos.app>'),
    SENTRY_DSN: z.string().optional(),
    EXPO_ACCESS_TOKEN: z.string().optional(),
    INTERNAL_WORKER_SECRET: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (data.JWT_ACCESS_SECRET.includes('dev-only') || data.JWT_ACCESS_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production JWT_ACCESS_SECRET must be a strong 32+ character secret',
        });
      }
      if (data.JWT_REFRESH_SECRET.includes('dev-only') || data.JWT_REFRESH_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_REFRESH_SECRET'],
          message: 'Production JWT_REFRESH_SECRET must be a strong 32+ character secret',
        });
      }
      if (
        data.STORAGE_SIGNING_SECRET.includes('dev-only') ||
        data.STORAGE_SIGNING_SECRET.length < 32
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['STORAGE_SIGNING_SECRET'],
          message: 'Production STORAGE_SIGNING_SECRET must be a strong 32+ character secret',
        });
      }
      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production',
        });
      }
      if (data.STORAGE_DRIVER === 's3' && !data.S3_BUCKET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['S3_BUCKET'],
          message: 'S3_BUCKET is required when STORAGE_DRIVER=s3',
        });
      }
      if (data.EMAIL_PROVIDER === 'resend' && !data.EMAIL_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['EMAIL_API_KEY'],
          message: 'EMAIL_API_KEY is required when EMAIL_PROVIDER=resend',
        });
      }
      if (data.AI_PROVIDER !== 'none' && !data.AI_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AI_API_KEY'],
          message: 'AI_API_KEY is required when AI_PROVIDER is enabled',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid API environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid API environment configuration');
}

export const env = parsed.data;
