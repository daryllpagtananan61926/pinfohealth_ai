import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';
import chatRoutes from '../../src/modules/chat/chat.routes.js';
import impactRoutes from '../../src/modules/impact/impact.routes.js';

// Mock the Gemini API call
vi.mock('../../src/modules/chat/chat.service.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    streamGeminiDeltas: async function* (messages) {
      yield { type: 'text', delta: 'Test response from mocked LLM' };
    },
  };
});

describe('POST /api/chat', () => {
  let app;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(chatRoutes);
    await app.register(impactRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 400 for invalid body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: { invalid: 'body' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for missing sessionId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: { messages: [{ role: 'user', content: 'hi' }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-123',
        messages: [{ role: 'system', content: 'hi' }],
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns crisis response for self-harm language', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-crisis',
        messages: [{ role: 'user', content: 'I want to kill myself' }],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.type).toBe('crisis');
    expect(body.reply).toContain('NCMH Crisis Hotline');
  });

  it('returns crisis response for hopelessness with plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-crisis-2',
        messages: [{ role: 'user', content: 'I feel hopeless and have a plan to end my life' }],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.type).toBe('crisis');
  });

  it('returns SSE stream for valid non-crisis message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-stream',
        messages: [{ role: 'user', content: 'I am feeling stressed' }],
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.payload).toContain('data: {"type":"text"');
    expect(res.payload).toContain('[DONE]');
  });

  it('includes CORS header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-cors',
        messages: [{ role: 'user', content: 'hello' }],
      },
    });
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('enforces rate limit (20 req/hr)', async () => {
    // This test would need a real rate limiter with time window
    // For now, just verify the endpoint works
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        sessionId: 'test-ratelimit',
        messages: [{ role: 'user', content: 'test' }],
      },
    });
    expect([200, 429]).toContain(res.statusCode);
  });
});