import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  // Several tests run fold-in and the index build as child processes; in parallel they need more than 5s.
  test: { include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'], environment: 'node', testTimeout: 60_000 },
});
