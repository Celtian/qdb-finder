import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { scoreValueClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import type { TeamDetails } from '../../core/qdb-contracts';
import { positionBadgeClass } from '../../core/position';

const scoreClass = (value: number | null): string =>
  value === null ? '' : `score-badge ${scoreValueClass(value)}`;

@Component({
  selector: 'app-team-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialogRef<TeamDetail>);
  protected readonly team = inject<TeamDetails>(MAT_DIALOG_DATA);
  protected readonly metrics = [
    { label: 'Overall', value: this.team.overall, className: scoreClass(this.team.overall) },
    { label: 'Attack', value: this.team.attack, className: scoreClass(this.team.attack) },
    { label: 'Midfield', value: this.team.midfield, className: scoreClass(this.team.midfield) },
    { label: 'Defence', value: this.team.defence, className: scoreClass(this.team.defence) },
  ];
  protected readonly players = this.team.players.map((player) => ({
    ...player,
    overallClass: `score-badge ${scoreValueClass(player.overall)}`,
    positions: player.positions.map((value) => ({
      value,
      className: positionBadgeClass(value),
    })),
  }));

  protected async viewPlayers(): Promise<void> {
    await this.router.navigate(['/players'], {
      queryParams: { version: this.team.version, teamId: this.team.teamId },
    });
    this.dialog.close();
  }
}
