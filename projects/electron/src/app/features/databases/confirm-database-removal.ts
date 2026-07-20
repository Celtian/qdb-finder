import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import type { DatabaseDescriptor } from '../../core/qdb-contracts';

@Component({
  selector: 'app-confirm-database-removal',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './confirm-database-removal.html',
})
export class ConfirmDatabaseRemoval {
  protected readonly data = inject<DatabaseDescriptor>(MAT_DIALOG_DATA);
}
