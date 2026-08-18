import { logEvent } from './impact.repository.js';

async function safeLog(request, eventType) {
  try {
    await logEvent(eventType);
  } catch (error) {
    request.log.error({ err: error.message }, `failed to log impact event ${eventType}`);
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
    return { valid: false, error: 'helpful must be a boolean..' };
  }
  return { valid: true, error: null };
}

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
}

export default impactRoutes;
