import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      all: false,
      reporter: ['text', 'json-summary', 'json'],
      provider: 'istanbul',
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: [{ find: '@app', replacement: resolve(__dirname, './src') }],
  },
});
