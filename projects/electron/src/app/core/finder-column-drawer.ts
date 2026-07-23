import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, computed, inject, signal } from '@angular/core';
import { disabled, form, FormField, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  defaultFinderColumnPreference,
  fromFinderColumnVisibility,
  toFinderColumnVisibility,
  type FinderColumnDefinition,
  type FinderColumnPreference,
  type FinderKind,
} from './finder-columns';

export interface FinderColumnDrawerData {
  finder: FinderKind;
  columns: readonly FinderColumnDefinition[];
  preference: FinderColumnPreference;
}

@Component({
  selector: 'app-finder-column-drawer',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDropList,
    CdkScrollable,
    FormField,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './finder-column-drawer.html',
  styleUrl: './finder-column-drawer.css',
})
export class FinderColumnDrawer {
  protected readonly data = inject<FinderColumnDrawerData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FinderColumnDrawer, FinderColumnPreference>);
  private readonly order = signal(this.data.preference.order);
  private readonly visibilityModel = signal(toFinderColumnVisibility(this.data.preference.visible));
  protected readonly announcement = signal('');
  protected readonly orderedColumns = computed(() => {
    const definitions = new Map(this.data.columns.map((column) => [column.key, column]));
    return this.order().flatMap((key) => {
      const definition = definitions.get(key);
      return definition ? [definition] : [];
    });
  });
  protected readonly columnsForm = form(this.visibilityModel, (path) => disabled(path.name));

  protected resetDefaults(): void {
    const defaults = defaultFinderColumnPreference(this.data.finder);
    this.order.set(defaults.order);
    this.visibilityModel.set(toFinderColumnVisibility(defaults.visible));
    this.announcement.set('Default column order and visibility restored.');
  }

  protected drop(event: CdkDragDrop<FinderColumnDefinition[]>): void {
    this.reorder(event.previousIndex, event.currentIndex);
  }

  protected moveColumn(column: FinderColumnDefinition, offset: -1 | 1): void {
    const previousIndex = this.order().indexOf(column.key);
    const currentIndex = previousIndex + offset;
    if (currentIndex < 0 || currentIndex >= this.order().length) {
      this.announcement.set(
        `${column.label} is already the ${offset < 0 ? 'first' : 'last'} column.`,
      );
      return;
    }
    this.reorder(previousIndex, currentIndex);
  }

  protected apply(): void {
    void submit(this.columnsForm, async () => {
      await Promise.resolve();
      this.dialogRef.close({
        version: 2,
        order: this.order(),
        visible: fromFinderColumnVisibility(this.orderedColumns(), this.visibilityModel()),
      });
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  private reorder(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const order = [...this.order()];
    moveItemInArray(order, previousIndex, currentIndex);
    this.order.set(order);
    const column = this.data.columns.find(({ key }) => key === order[currentIndex]);
    if (column) {
      this.announcement.set(
        `${column.label} moved to position ${currentIndex + 1} of ${order.length}.`,
      );
    }
  }
}
