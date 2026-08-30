import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadSystemPrompt() {
  const localPath = process.env.SYSTEM_PROMPT_PATH;
  const secretPath = '/etc/secrets/system-prompt.txt';

  // Priority: explicit local path > secret file (prod) > local default
  const candidates = [
    localPath,
    secretPath,
    './prompts/system-prompt.txt',
  ].filter(Boolean);

  for (const path of candidates) {
    const resolved = resolve(path);
    if (existsSync(resolved)) {
      try {
        const prompt = readFileSync(resolved, 'utf-8').trim();
        if (!prompt) throw new Error('Empty prompt');
        if (prompt.length > 50000) throw new Error('Prompt too large (>50KB)');
        return prompt;
      } catch (err) {
        throw new Error(`Failed to load system prompt from ${resolved}: ${err.message}`);
      }
    }
  }

  throw new Error(
    'System prompt not found. Set SYSTEM_PROMPT_PATH in .env (local) or mount Secret File at /etc/secrets/system-prompt.txt (production).'
  );
}

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  port: Number(process.env.PORT) || 3000,
  allowedOrigin: (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').replace(/\/$/, ''),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  databaseUrl: process.env.DATABASE_URL || '',
  logLevel: isProd ? 'warn' : 'info',
  systemPrompt: loadSystemPrompt(),
};

export default config;