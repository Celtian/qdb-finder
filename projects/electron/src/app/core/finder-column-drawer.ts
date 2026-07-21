import { Component, inject, signal } from '@angular/core';
import { disabled, form, FormField, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  fromFinderColumnVisibility,
  toFinderColumnVisibility,
  type FinderColumnDefinition,
  type FinderColumnKey,
  type FinderKind,
} from './finder-columns';

export interface FinderColumnDrawerData {
  finder: FinderKind;
  columns: readonly FinderColumnDefinition[];
  defaultColumns: readonly FinderColumnKey[];
  visibleColumns: readonly FinderColumnKey[];
}

@Component({
  selector: 'app-finder-column-drawer',
  imports: [FormField, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './finder-column-drawer.html',
  styleUrl: './finder-column-drawer.css',
})
export class FinderColumnDrawer {
  protected readonly data = inject<FinderColumnDrawerData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FinderColumnDrawer, FinderColumnKey[]>);
  private readonly visibilityModel = signal(toFinderColumnVisibility(this.data.visibleColumns));
  protected readonly columnsForm = form(this.visibilityModel, (path) => disabled(path.name));

  protected resetDefaults(): void {
    this.visibilityModel.set(toFinderColumnVisibility(this.data.defaultColumns));
  }

  protected apply(): void {
    void submit(this.columnsForm, async () => {
      await Promise.resolve();
      this.dialogRef.close(fromFinderColumnVisibility(this.data.columns, this.visibilityModel()));
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
