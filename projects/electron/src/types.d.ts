import type { QdbApi } from './app/core/qdb-contracts';

declare global {
  interface Window {
    qdb: QdbApi;
  }
}

export {};
