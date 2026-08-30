import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Fastify from 'fastify';

// Mock the database pool using vi.hoisted to avoid hoisting issues
const { mockPool } = vi.hoisted(() => ({
  mockPool: {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

vi.mock('../../src/db.js', () => ({
  pool: mockPool,
}));

import impactRoutes from '../../src/modules/impact/impact.routes.js';

describe('Impact endpoints', () => {
  let app;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(impactRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockPool.query.mockClear();
    mockPool.query.mockResolvedValue({ rows: [] });
  });

  describe('POST /api/session-started', () => {
    it('returns 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/session-started',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
    });
  });

  describe('POST /api/feedback', () => {
    it('returns 200 for valid feedback', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: { sessionId: 'test-fb', helpful: true },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
    });

    it('returns 200 for negative feedback', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: { sessionId: 'test-fb-2', helpful: false },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 for missing sessionId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: { helpful: true },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for missing helpful', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: { sessionId: 'test' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for non-boolean helpful', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/feedback',
        payload: { sessionId: 'test', helpful: 'yes' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/ui-event', () => {
    it('returns 200 for valid ui event', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ui-event',
        payload: {
          sessionId: 'test-ui',
          eventType: 'ui_breathing_complete',
          metadata: { component: 'breathing-exercise', action: 'complete' },
        },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 for invalid eventType', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ui-event',
        payload: {
          sessionId: 'test-ui',
          eventType: 'invalid_event',
          metadata: {},
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 for missing sessionId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ui-event',
        payload: { eventType: 'ui_breathing_complete' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('accepts all allowed event types', async () => {
      const types = [
        'ui_breathing_complete',
        'ui_habit_done',
        'ui_mood_select',
        'ui_poll_vote',
        'ui_grounding_done',
      ];

      for (const type of types) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/ui-event',
          payload: { sessionId: `test-${type}`, eventType: type },
        });
        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe('GET /api/impact-summary', () => {
    it('returns aggregated counts', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/impact-summary',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(typeof body.data).toBe('object');
    });

    it('does not expose message content', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/impact-summary',
      });
      const body = JSON.parse(res.payload);
      const dataStr = JSON.stringify(body.data);
      // Should not contain any message content
      expect(dataStr).not.toContain('sessionId');
    });
  });
});