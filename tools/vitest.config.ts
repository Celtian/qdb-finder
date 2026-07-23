import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tools/**/*.spec.ts'],
    environment: 'node',
    globalSetup: ['./tools/vitest.global-setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/tools',
      reporter: ['text', 'html', 'cobertura'],
      include: ['tools/database/importer.ts', 'projects/electron/electron/database.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
