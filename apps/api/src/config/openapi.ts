import { API_PREFIX } from '@lifeos/config';

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'LifeOS API',
    version: '0.2.0',
    description: 'REST API for LifeOS — AI-Powered Personal Life Administration Platform.',
  },
  servers: [
    {
      url: API_PREFIX,
      description: 'API v1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Service health check',
        tags: ['System'],
        responses: {
          '200': { description: 'Service is operational' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new user account with DPDP privacy consent',
        tags: ['Auth'],
        responses: {
          '201': { description: 'User registered and session tokens issued' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate with email and password',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Authenticated session returned' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue new access token',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Rotated token pair returned' },
          '401': { description: 'Invalid, expired, or reused refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke current refresh token and device session',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Session revoked' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Request password reset token',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Standardized reset acknowledgement' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Complete password reset using issued token',
        tags: ['Auth'],
        responses: {
          '200': { description: 'Password updated and existing sessions revoked' },
          '401': { description: 'Invalid or expired reset token' },
        },
      },
    },
    '/auth/sessions': {
      get: {
        summary: 'List active device sessions for the authenticated user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Active device sessions' },
        },
      },
    },
    '/auth/sessions/{deviceId}': {
      delete: {
        summary: 'Revoke a specific device session owned by the user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Device session revoked' },
          '404': { description: 'Device session not found' },
        },
      },
    },
    '/auth/account': {
      delete: {
        summary: 'Soft-delete the authenticated user account and revoke all sessions',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Account deleted' },
          '401': { description: 'Invalid password confirmation' },
        },
      },
    },
    '/users/me': {
      get: {
        summary: 'Get authenticated user summary and profile',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile returned' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/profile': {
      patch: {
        summary: 'Update authenticated user profile and onboarding settings',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
  },
} as const;
