import type { QdbApi, QdbWindowApi } from './app/core/qdb-contracts';

declare global {
  interface Window {
    qdb: QdbApi;
    qdbWindow?: QdbWindowApi;
  }
}

export {};
