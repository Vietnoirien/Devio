import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['agency_workspace/src/**/*.test.ts', 'agency_workspace/src/**/*.test.tsx'],
    environment: 'node'
  }
});
