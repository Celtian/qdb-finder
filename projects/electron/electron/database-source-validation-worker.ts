import { parentPort, workerData } from 'node:worker_threads';
import { fifaForVersion, validateSourceData } from './importer';
import { createT3dbImportSource, t3dbSourceErrorMessage } from './t3db-source';

interface SourceValidationWorkerData {
  source:
    | { kind: 'text-folder'; path: string }
    | { kind: 't3db'; databasePath: string; metadataPath: string };
  version: number;
}

const data = workerData as SourceValidationWorkerData;

const run = async (): Promise<void> => {
  try {
    const fifa = fifaForVersion(data.version);
    const source =
      data.source.kind === 't3db'
        ? await createT3dbImportSource(fifa, data.source.databasePath, data.source.metadataPath)
        : { fifa, path: data.source.path };
    const report = validateSourceData(source, (message) =>
      parentPort?.postMessage({ type: 'progress', message }),
    );
    parentPort?.postMessage({ type: 'completed', report });
  } catch (error) {
    parentPort?.postMessage({
      type: 'failed',
      message:
        data.source.kind === 't3db'
          ? t3dbSourceErrorMessage(error)
          : 'The source folder could not be validated. Check the folder and try again.',
      diagnostics: [error instanceof Error ? (error.stack ?? error.message) : String(error)],
    });
  }
};

void run();
