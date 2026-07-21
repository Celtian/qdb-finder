import { Component, computed, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import type { DatabaseDescriptor } from '../qdb-contracts';

const ALL_DATABASES = '__all__';

@Component({
  selector: 'app-database-filter',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './database-filter.html',
  styleUrl: './database-filter.css',
})
export class DatabaseFilter {
  readonly databases = input.required<DatabaseDescriptor[]>();
  readonly selected = input.required<string[]>();
  readonly selectedChange = output<string[]>();
  protected readonly allDatabases = ALL_DATABASES;
  protected readonly selectValue = computed(() =>
    this.selected().length ? this.selected() : [ALL_DATABASES],
  );
  protected readonly selectionLabel = computed(() => {
    const selected = this.selected();
    if (!selected.length) return 'All databases';
    const names = this.databases()
      .filter((database) => selected.includes(database.id))
      .map((database) => database.name);
    return names.length === 1 ? names[0]! : `${names.length} databases`;
  });

  protected changeSelection(value: string[]): void {
    if (value.includes(ALL_DATABASES)) {
      const databaseIds = value.filter((id) => id !== ALL_DATABASES);
      this.selectedChange.emit(this.selected().length ? [] : databaseIds);
      return;
    }
    this.selectedChange.emit(value.length ? value : []);
  }
}
