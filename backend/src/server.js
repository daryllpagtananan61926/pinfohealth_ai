import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import config from './config.js';
import chatRoutes from './modules/chat/chat.routes.js';
import impactRoutes from './modules/impact/impact.routes.js';

const isProd = process.env.NODE_ENV === 'production';

const REDACT_KEYS = new Set([
  'sessionId',
  'messages',
  'content',
  'authorization',
  'cookie',
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'geminiApiKey',
]);

function hashIP(ip) {
  if (!ip) return 'unknown';
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'pinfohealth-salt')).digest('hex').slice(0, 12);
}

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      out[key] = redact(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const app = Fastify({
  logger: {
    level: config.logLevel,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: redact(req.headers),
        remoteAddress: req.ip ? hashIP(req.ip) : undefined,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: (err) => ({
        message: err.message,
        stack: isProd ? undefined : err.stack,
      }),
    },
    redact: {
      paths: [...REDACT_KEYS].map(k => `req.headers.${k}`),
      censor: '[REDACTED]',
    },
  },
  trustProxy: isProd,
});

app.addHook('onRequest', async (request) => {
  request.id = randomUUID();
  request.startTime = process.hrtime.bigint();
});

app.addHook('onResponse', async (request, reply) => {
  const durationMs = Number(process.hrtime.bigint() - request.startTime) / 1e6;
  request.log.info({
    requestId: request.id,
    method: request.method,
    path: request.routeOptions?.url || request.url,
    statusCode: reply.statusCode,
    durationMs: Math.round(durationMs),
    ipHash: hashIP(request.ip),
  }, 'access');
});

if (!process.env.ALLOWED_ORIGIN) {
  app.log.warn(
    `ALLOWED_ORIGIN is not set; CORS will only allow ${config.allowedOrigin}. Set it to the deployed Vercel URL in production.`
  );
}

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://generativelanguage.googleapis.com', 'https://pinfohealth-ai-api.onrender.com'],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

await app.register(cors, {
  origin: config.allowedOrigin ? [config.allowedOrigin] : false,
});

await app.register(rateLimit, {
  global: false,
});

app.get('/health', async () => ({ status: 'ok' }));

await app.register(chatRoutes);
await app.register(impactRoutes);

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;