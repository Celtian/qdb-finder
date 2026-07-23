import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseLibrary } from '../../projects/electron/electron/database-library';

interface WorkerMessage {
  type: 'progress' | 'completed' | 'failed';
  message?: string;
  error?: { message: string };
}

const workers = new Set<Worker>();
const directories: string[] = [];

const startWorker = (name: string, workerData: unknown): Worker => {
  const worker = new Worker(join(process.cwd(), '.electron', 'electron', name), { workerData });
  workers.add(worker);
  worker.once('exit', () => workers.delete(worker));
  return worker;
};

const terminalMessage = (worker: Worker): Promise<WorkerMessage> =>
  new Promise((resolve, reject) => {
    worker.on('message', (message: WorkerMessage) => {
      if (message.type !== 'progress') resolve(message);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}.`));
    });
  });

describe('database import workers', () => {
  afterEach(async () => {
    await Promise.all([...workers].map((worker) => worker.terminate()));
    workers.clear();
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true }));
  });

  it('sanitizes a validation-worker source failure', async () => {
    const worker = startWorker('database-source-validation-worker.js', {
      source: {
        kind: 't3db',
        databasePath: '/private/fifa_ng_db.db',
        metadataPath: '/private/fifa_ng_db-meta.xml',
      },
      version: 16,
    });

    const message = await terminalMessage(worker);

    expect(message).toMatchObject({
      type: 'failed',
      message:
        'The selected t3db database could not be opened. Check both source files and try again.',
    });
    expect(message.message).not.toContain('/private');
  });

  it('builds a canonical database in the import worker and installs it', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-worker-success-'));
    directories.push(root);
    const databaseId = '11111111-1111-4111-8111-111111111111';
    const library = new DatabaseLibrary(join(root, 'built-in.sqlite'), root);
    const outputPath = library.temporaryPath(databaseId);
    const worker = startWorker('database-import-worker.js', {
      databaseId,
      databaseName: 'Worker FIFA 16',
      outputPath,
      source: { kind: 'text-folder', path: join(process.cwd(), 'examples', 'fifa16') },
      version: 16,
    });

    await expect(terminalMessage(worker)).resolves.toEqual({ type: 'completed' });
    expect(library.install(databaseId)).toMatchObject({
      id: databaseId,
      name: 'Worker FIFA 16',
      kind: 'custom',
      versions: [16],
      status: 'available',
    });
    expect(existsSync(library.pathFor(databaseId))).toBe(true);
  }, 60_000);

  it('can terminate an active import and remove all temporary SQLite files', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-worker-cancel-'));
    directories.push(root);
    const databaseId = '22222222-2222-4222-8222-222222222222';
    const library = new DatabaseLibrary(join(root, 'built-in.sqlite'), root);
    const outputPath = library.temporaryPath(databaseId);
    const worker = startWorker('database-import-worker.js', {
      databaseId,
      databaseName: 'Cancelled FIFA 23',
      outputPath,
      source: { kind: 'text-folder', path: join(process.cwd(), 'examples', 'fifa23') },
      version: 23,
    });

    await new Promise<void>((resolve, reject) => {
      worker.on('message', (message: WorkerMessage) => {
        if (message.type === 'progress' && message.message?.includes('Creating schema'))
          void worker.terminate().then(() => resolve(), reject);
      });
      worker.once('error', reject);
    });
    library.discardTemporary(databaseId);

    expect(existsSync(outputPath)).toBe(false);
    expect(existsSync(`${outputPath}-wal`)).toBe(false);
    expect(existsSync(`${outputPath}-shm`)).toBe(false);
  }, 60_000);
});
