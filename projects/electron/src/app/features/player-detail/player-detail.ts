import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { scoreValueClass } from '../../core/attribute-value';
import type { PlayerDetails } from '../../core/qdb-contracts';
import { CountryFlag } from '../../core/country-flag/country-flag';
import { positionBadgeClass } from '../../core/position';

@Component({
  selector: 'app-player-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
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
  protected readonly teams = this.player.teams.join(', ') || 'Free agent';
  protected readonly positions = this.player.positions.map((value) => ({
    value,
    className: positionBadgeClass(value),
  }));
  protected readonly overallClass = `score-badge ${scoreValueClass(this.player.overall)}`;
  protected readonly potentialClass = `score-badge ${scoreValueClass(this.player.potential)}`;
  protected readonly bestPositionClass = positionBadgeClass(this.player.bestPosition);
  protected readonly ratings = Object.entries(this.player.ratings).map(([key, value]) => ({
    key,
    value,
    className: positionBadgeClass(key),
  }));
  protected readonly attributes = Object.entries(this.player.attributes).map(([key, value]) => ({
    key,
    value,
    className: scoreValueClass(value),
  }));
}
