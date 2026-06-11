import { defineConfig } from 'vitest/config';

// Unit tests for the framework-agnostic contact backend (validation, rate
// limiting, handler). E2E (Playwright) lives separately under tests/e2e.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
