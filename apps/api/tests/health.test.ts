import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('API Foundation', () => {
  const app = createApp();

  it('GET /api/v1/health returns structured health response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.service).toBe('@lifeos/api');
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('GET /api/v1/docs/openapi.json returns OpenAPI 3.1 spec', async () => {
    const response = await request(app).get('/api/v1/docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.1.0');
    expect(response.body.info.title).toBe('LifeOS API');
  });

  it('returns standardized 404 envelope for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
