import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import config from './config.js';
import chatRoutes from './modules/chat/chat.routes.js';
import impactRoutes from './modules/impact/impact.routes.js';

const app = Fastify({ logger: { level: 'info' } });

await app.register(cors, {
  origin: config.allowedOrigin ? [config.allowedOrigin] : false,
});

await app.register(rateLimit, {
  max: 20,
  timeWindow: '1 hour',
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