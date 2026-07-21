import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-finder-filter-drawer',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './finder-filter-drawer.html',
  styleUrl: './finder-filter-drawer.css',
})
export class FinderFilterDrawer {
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  readonly title = input.required<string>();
  readonly titleId = input.required<string>();
  readonly canClear = input(false);
  readonly clearAll = output<void>();
  readonly apply = output<void>();

  protected cancel(): void {
    this.dialogRef?.close();
  }
}
