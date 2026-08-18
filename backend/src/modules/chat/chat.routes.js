import { streamGeminiDeltas } from './chat.service.js';
import { checkCrisis, CRISIS_RESPONSE } from '../safety/crisis-check.js';
import { logEvent } from '../impact/impact.repository.js';
import config from '../../config.js';

const VALID_ROLES = new Set(['user', 'assistant']);
const MAX_CONTENT_LENGTH = 2000;
const MAX_MESSAGES = 20;

function validateChatBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }
  if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) {
    return { valid: false, error: 'sessionId must be a non-empty string.' };
  }
  if (!Array.isArray(body.messages)) {
    return { valid: false, error: 'messages must be an array.' };
  }
  if (body.messages.length === 0) {
    return { valid: false, error: 'messages must not be empty.' };
  }
  if (body.messages.length > MAX_MESSAGES) {
    return { valid: false, error: `messages must not exceed ${MAX_MESSAGES} entries.` };
  }
  for (const message of body.messages) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      return { valid: false, error: 'Each message must be an object.' };
    }
    if (!VALID_ROLES.has(message.role)) {
      return { valid: false, error: 'role must be either "user" or "assistant".' };
    }
    if (typeof message.content !== 'string') {
      return { valid: false, error: 'content must be a string.' };
    }
    if (message.content.length > MAX_CONTENT_LENGTH) {
      return { valid: false, error: `content must not exceed ${MAX_CONTENT_LENGTH} characters.` };
    }
  }
  return { valid: true, error: null };
}

async function chatRoutes(fastify) {
  fastify.post(
    '/api/chat',
    { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } },
    async (request, reply) => {
    const { valid, error } = validateChatBody(request.body);
    if (!valid) {
      return reply.code(400).send({ error });
    }

    const lastUserMessage = [...request.body.messages].reverse().find(
      (m) => m.role === 'user'
    );
    if (lastUserMessage && checkCrisis(lastUserMessage.content)) {
      request.log.info('crisis filter triggered');
      return reply.code(200).send({ type: 'crisis', reply: CRISIS_RESPONSE });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': config.allowedOrigin,
      Vary: 'Origin',
    });

    try {
      for await (const delta of streamGeminiDeltas(request.body.messages)) {
        reply.raw.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
      try {
        await logEvent('message_sent');
      } catch (error) {
        request.log.error({ err: error.message }, 'failed to log message_sent impact event');
      }
    } catch (error) {
      request.log.error({ err: error.message }, 'chat streaming failed');
      if (!reply.raw.headersSent) {
        reply.raw.end();
        return;
      }
      reply.raw.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    }
  });
}

export default chatRoutes;