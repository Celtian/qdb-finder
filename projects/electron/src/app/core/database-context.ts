import { Service, signal } from '@angular/core';
import type { DatabaseInfo } from './qdb-contracts';

@Service()
export class DatabaseContext {
  readonly info = signal<DatabaseInfo | undefined>(undefined);
  readonly revision = signal(0);

  set(info: DatabaseInfo, changed = false): void {
    this.info.set(info);
    if (changed) this.revision.update((revision) => revision + 1);
  }
}
