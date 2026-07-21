import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { scoreBadgeClass, scoreValueClass } from '../../core/attribute-value';
import type { PlayerDetails } from '../../core/qdb-contracts';
import { CountryFlag } from '../../core/country-flag/country-flag';
import {
  normalizeInternationalReputation,
  playerAttributeGroups,
} from '../../core/player-attribute';
import {
  formatDateOnly,
  preferredFootLabel as formatPreferredFoot,
} from '../../core/player-profile-value';
import { positionBadgeClass, positionRatingRows } from '../../core/position';

@Component({
  selector: 'app-player-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetail {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialogRef<PlayerDetail>);
  protected readonly player = inject<PlayerDetails>(MAT_DIALOG_DATA);
  protected readonly teams = this.player.teams.join(', ') || 'Free agent';
  protected readonly positions = this.player.positions.map((value) => ({
    value,
    className: positionBadgeClass(value),
  }));
  protected readonly overallClass = scoreBadgeClass(this.player.overall);
  protected readonly potentialClass = scoreBadgeClass(this.player.potential);
  protected readonly bestPositionClass = positionBadgeClass(this.player.bestPosition);
  protected readonly birthDateLabel = formatDateOnly(this.player.birthDate);
  protected readonly snapshotDateLabel = formatDateOnly(this.player.snapshotDate);
  protected readonly preferredFootLabel = formatPreferredFoot(this.player.preferredFoot);
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

  protected async viewTeams(): Promise<void> {
    const navigated = await this.router.navigate(['/teams'], {
      queryParams: {
        databaseId: this.player.databaseId,
        version: this.player.version,
        playerId: this.player.playerId,
      },
    });
    if (navigated) this.dialog.close();
  }
}
