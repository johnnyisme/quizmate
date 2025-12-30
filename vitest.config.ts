import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['node_modules', '.next'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
