import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

describe('Health endpoint', () => {
  let app;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    app.get('/health', async () => ({ status: 'ok' }));
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
  });
});