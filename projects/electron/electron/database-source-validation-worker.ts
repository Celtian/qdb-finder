import { parentPort, workerData } from 'node:worker_threads';
import { fifaForVersion, validateSourceData } from './importer';

interface SourceValidationWorkerData {
  sourcePath: string;
  version: number;
}

const data = workerData as SourceValidationWorkerData;

try {
  const report = validateSourceData(
    { fifa: fifaForVersion(data.version), path: data.sourcePath },
    (message) => parentPort?.postMessage({ type: 'progress', message }),
  );
  parentPort?.postMessage({ type: 'completed', report });
} catch (error) {
  parentPort?.postMessage({
    type: 'failed',
    message: 'The source folder could not be validated. Check the folder and try again.',
    diagnostics: [error instanceof Error ? (error.stack ?? error.message) : String(error)],
  });
}
