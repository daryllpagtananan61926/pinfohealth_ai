// Global test setup
import { beforeAll, afterAll } from 'vitest';

// Mock environment variables for testing
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.DATABASE_URL = 'postgres://test:test@localhost/test';
  process.env.ALLOWED_ORIGIN = 'http://localhost:5173';
  process.env.SYSTEM_PROMPT_PATH = './prompts/system-prompt.txt';
});

afterAll(() => {
  // Cleanup if needed
});