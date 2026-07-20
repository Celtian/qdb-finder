import { parentPort, workerData } from 'node:worker_threads';
import { buildDatabase, fifaForVersion, ImportSourceValidationError } from './importer';

interface ImportWorkerData {
  databaseId: string;
  databaseName: string;
  outputPath: string;
  sourcePath: string;
  version: number;
}

const data = workerData as ImportWorkerData;

try {
  buildDatabase({
    sources: [{ fifa: fifaForVersion(data.version), path: data.sourcePath }],
    outputPath: data.outputPath,
    databaseId: data.databaseId,
    databaseName: data.databaseName,
    databaseKind: 'custom',
    verifyExpectedCounts: false,
    progress: (message) => parentPort?.postMessage({ type: 'progress', message }),
  });
  parentPort?.postMessage({ type: 'completed' });
} catch (error) {
  if (error instanceof ImportSourceValidationError) {
    parentPort?.postMessage({
      type: 'failed',
      error: error.report
        ? {
            ...error.issue,
            code: 'source-corrupted',
            validation: error.report,
          }
        : error.issue,
      diagnostics: error.diagnostics,
    });
  } else {
    parentPort?.postMessage({
      type: 'failed',
      error: {
        code: 'import-failed',
        message: 'Database import failed. Check the selected folder and try again.',
        files: [],
      },
      diagnostics: [error instanceof Error ? (error.stack ?? error.message) : String(error)],
    });
  }
}
