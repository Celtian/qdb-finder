import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tools/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/tools',
      reporter: ['text', 'html', 'cobertura'],
      include: ['tools/database/importer.ts', 'projects/electron/electron/database.ts'],
    },
  },
});
