import { API_PREFIX } from '@lifeos/config';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'LifeOS API',
    version: '0.1.0',
    description: 'REST API for LifeOS — AI-Powered Personal Life Administration Platform.',
  },
  servers: [
    {
      url: API_PREFIX,
      description: 'API v1',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Service health check',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Service is operational',
          },
        },
      },
    },
  },
} as const;
