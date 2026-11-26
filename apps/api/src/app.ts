import { API_PREFIX } from '@lifeos/config';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { openApiSpec } from './config/openapi';
import { prisma } from './config/prisma';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limit';
import { requestIdMiddleware } from './middleware/request-id';
import { PrismaAuthRepository } from './modules/auth/auth.repository';
import { createAuthRouter } from './modules/auth/auth.routes';
import type { IAuthRepository } from './modules/auth/auth.types';
import { PasswordService } from './modules/auth/password.service';
import { TokenService } from './modules/auth/token.service';
import { PrismaCategoriesRepository } from './modules/categories/categories.repository';
import { createCategoriesRouter } from './modules/categories/categories.routes';
import type { ICategoriesRepository } from './modules/categories/categories.types';
import { PrismaDashboardRepository } from './modules/dashboard/dashboard.repository';
import { createDashboardRouter } from './modules/dashboard/dashboard.routes';
import type { IDashboardRepository } from './modules/dashboard/dashboard.types';
import { PrismaDocumentsRepository } from './modules/documents/documents.repository';
import { createDocumentsRouter } from './modules/documents/documents.routes';
import type { IDocumentsRepository } from './modules/documents/documents.types';
import { createHealthRouter } from './modules/health/health.routes';
import { createStorageService } from './modules/storage';
import type { LocalPrivateStorageService } from './modules/storage/local-storage.service';
import { createLocalStorageRouter } from './modules/storage/storage.routes';
import type { IStorageService } from './modules/storage/storage.types';
import { PrismaUsersRepository } from './modules/users/users.repository';
import { createUsersRouter } from './modules/users/users.routes';
import type { IUsersRepository } from './modules/users/users.types';

export interface AppDependencies {
  authRepository?: IAuthRepository;
  usersRepository?: IUsersRepository;
  categoriesRepository?: ICategoriesRepository;
  documentsRepository?: IDocumentsRepository;
  dashboardRepository?: IDashboardRepository;
  storageService?: IStorageService;
  localStorageService?: LocalPrivateStorageService | null;
  passwordService?: PasswordService;
  tokenService?: TokenService;
}

export function createApp(deps: AppDependencies = {}): Express {
  const app = express();

  const authRepository = deps.authRepository ?? new PrismaAuthRepository(prisma);
  const usersRepository = deps.usersRepository ?? new PrismaUsersRepository(prisma);
  const categoriesRepository = deps.categoriesRepository ?? new PrismaCategoriesRepository(prisma);
  const documentsRepository = deps.documentsRepository ?? new PrismaDocumentsRepository(prisma);
  const dashboardRepository = deps.dashboardRepository ?? new PrismaDashboardRepository(prisma);
  const passwordService = deps.passwordService ?? new PasswordService();
  const tokenService = deps.tokenService ?? new TokenService();

  const defaultStorage =
    deps.storageService !== undefined
      ? {
          storageService: deps.storageService,
          localStorageService: deps.localStorageService ?? null,
        }
      : createStorageService();

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

  // Mount local signed binary storage routes before express.json() so raw binary PUT uploads work cleanly.
  if (defaultStorage.localStorageService) {
    app.use(`${API_PREFIX}/storage`, createLocalStorageRouter(defaultStorage.localStorageService));
  }

  app.use(express.json({ limit: '1mb' }));
  app.use(apiRateLimiter);

  app.use(`${API_PREFIX}/health`, createHealthRouter());
  app.use(
    `${API_PREFIX}/auth`,
    createAuthRouter({
      repository: authRepository,
      passwordService,
      tokenService,
    }),
  );
  app.use(
    `${API_PREFIX}/users`,
    createUsersRouter({
      repository: usersRepository,
      tokenService,
    }),
  );
  app.use(
    `${API_PREFIX}/categories`,
    createCategoriesRouter({
      repository: categoriesRepository,
      tokenService,
    }),
  );
  app.use(
    `${API_PREFIX}/documents`,
    createDocumentsRouter({
      documentsRepository,
      categoriesRepository,
      storageService: defaultStorage.storageService,
      tokenService,
    }),
  );
  app.use(
    `${API_PREFIX}/dashboard`,
    createDashboardRouter({
      repository: dashboardRepository,
      tokenService,
    }),
  );

  app.get(`${API_PREFIX}/docs/openapi.json`, (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
