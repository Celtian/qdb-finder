import { parentPort, workerData } from 'node:worker_threads';
import { buildDatabase, fifaForVersion, ImportSourceValidationError } from './importer';
import { createT3dbImportSource } from './t3db-source';

interface ImportWorkerData {
  databaseId: string;
  databaseName: string;
  outputPath: string;
  source:
    | { kind: 'text-folder'; path: string }
    | { kind: 't3db'; databasePath: string; metadataPath: string };
  version: number;
}

const data = workerData as ImportWorkerData;

const run = async (): Promise<void> => {
  try {
    const fifa = fifaForVersion(data.version);
    const source =
      data.source.kind === 't3db'
        ? await createT3dbImportSource(fifa, data.source.databasePath, data.source.metadataPath)
        : { fifa, path: data.source.path };
    buildDatabase({
      sources: [source],
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
          message: 'Database import failed. Check the selected source and try again.',
          files: [],
        },
        diagnostics: [error instanceof Error ? (error.stack ?? error.message) : String(error)],
      });
    }
  }
};

void run();
