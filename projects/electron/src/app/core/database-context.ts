import { computed, Service, signal } from '@angular/core';
import type { DatabaseDescriptor } from './qdb-contracts';

@Service()
export class DatabaseContext {
  readonly databases = signal<DatabaseDescriptor[]>([]);
  readonly available = computed(() =>
    this.databases().filter((database) => database.status === 'available'),
  );
  readonly versions = computed(() =>
    [...new Set(this.available().flatMap((database) => database.versions))].sort(
      (left, right) => right - left,
    ),
  );
  readonly revision = signal(0);

  set(databases: DatabaseDescriptor[], changed = false): void {
    this.databases.set(databases);
    if (changed) this.revision.update((revision) => revision + 1);
  }
}
