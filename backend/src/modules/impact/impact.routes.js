import { logEvent, logUIEvent } from './impact.repository.js';

async function safeLog(request, eventType) {
  try {
    await logEvent(eventType);
  } catch (error) {
    request.log.error({ err: error.message }, `failed to log impact event ${eventType}`);
  }
}

async function safeLogUIEvent(request, eventType, metadata) {
  try {
    await logUIEvent(eventType, metadata);
  } catch (error) {
    request.log.error({ err: error.message }, `failed to log UI impact event ${eventType}`);
  }
}

function validateFeedbackBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
    return { valid: false, error: 'sessionId must be a non-empty string.' };
  }
  if (typeof body.helpful !== 'boolean') {
    return { valid: false, error: 'helpful must be a boolean.' };
  }
  return { valid: true, error: null };
}

function validateUIEventBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
    return { valid: false, error: 'sessionId must be a non-empty string.' };
  }
  if (typeof body.eventType !== 'string' || body.eventType.length === 0) {
    return { valid: false, error: 'eventType must be a non-empty string.' };
  }
  if (body.metadata !== undefined && (typeof body.metadata !== 'object' || body.metadata === null)) {
    return { valid: false, error: 'metadata must be an object.' };
  }
  return { valid: true, error: null };
}

const ALLOWED_UI_EVENT_TYPES = new Set([
  'ui_breathing_complete',
  'ui_habit_done',
  'ui_mood_select',
  'ui_poll_vote',
  'ui_grounding_done',
]);

async function impactRoutes(fastify) {
  fastify.post('/api/session-started', async (request, reply) => {
    await safeLog(request, 'session_started');
    return reply.send({ ok: true });
  });

  fastify.post('/api/feedback', async (request, reply) => {
    const { valid, error } = validateFeedbackBody(request.body);
    if (!valid) {
      return reply.code(400).send({ error });
    }
    await safeLog(request, request.body.helpful ? 'feedback_yes' : 'feedback_no');
    return reply.send({ ok: true });
  });

  fastify.post('/api/ui-event', async (request, reply) => {
    const { valid, error } = validateUIEventBody(request.body);
    if (!valid) {
      return reply.code(400).send({ error });
    }
    const { sessionId, eventType, metadata } = request.body;
    if (!ALLOWED_UI_EVENT_TYPES.has(eventType)) {
      return reply.code(400).send({ error: 'Invalid eventType' });
    }
    await safeLogUIEvent(request, eventType, { ...metadata, sessionId });
    return reply.send({ ok: true });
  });
}

export default impactRoutes;
