import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { scoreBadgeClass, scoreValueClass } from '../../core/attribute-value';
import type { PlayerDetails } from '../../core/qdb-contracts';
import { CountryFlag } from '../../core/country-flag/country-flag';
import {
  normalizeInternationalReputation,
  playerAttributeGroups,
} from '../../core/player-attribute';
import { positionBadgeClass, positionRatingRows } from '../../core/position';

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
  protected readonly overallClass = scoreBadgeClass(this.player.overall);
  protected readonly potentialClass = scoreBadgeClass(this.player.potential);
  protected readonly bestPositionClass = positionBadgeClass(this.player.bestPosition);
  protected readonly ratingRows = positionRatingRows(this.player.ratings);
  protected readonly attributeGroups = playerAttributeGroups(this.player.attributes);
  protected readonly potentialAttribute = {
    value: this.player.potential,
    className: scoreValueClass(this.player.potential),
  };
  protected readonly internationalReputation = normalizeInternationalReputation(
    this.player.raw['internationalrep'],
  );
  protected readonly reputationLabel =
    this.internationalReputation === null ? '—' : `${this.internationalReputation} / 5`;
  protected readonly reputationStars = [1, 2, 3, 4, 5].map((value) => ({
    value,
    filled: this.internationalReputation !== null && value <= this.internationalReputation,
  }));
}
