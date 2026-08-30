import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});