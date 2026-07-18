import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import type { PlayerDetails } from '../../core/qdb-contracts';
import { positionBadgeClass } from '../../core/position';

@Component({
  selector: 'app-player-detail',
  imports: [
    KeyValuePipe,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetail {
  protected readonly player = inject<PlayerDetails>(MAT_DIALOG_DATA);
  protected readonly positionBadgeClass = positionBadgeClass;
}
