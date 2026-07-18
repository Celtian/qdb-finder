import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { scoreValueClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import type { LeagueDetails } from '../../core/qdb-contracts';

@Component({
  selector: 'app-league-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './league-detail.html',
  styleUrl: './league-detail.css',
})
export class LeagueDetail {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialogRef<LeagueDetail>);
  protected readonly league = inject<LeagueDetails>(MAT_DIALOG_DATA);
  protected readonly teams = this.league.teams.map((team) => ({
    ...team,
    overallClass: team.overall === null ? '' : `score-badge ${scoreValueClass(team.overall)}`,
  }));
  protected readonly competition =
    this.league.isWomen === null ? 'Not specified' : this.league.isWomen ? "Women's" : "Men's";

  protected async viewTeams(): Promise<void> {
    await this.router.navigate(['/teams'], {
      queryParams: { version: this.league.version, leagueId: this.league.leagueId },
    });
    this.dialog.close();
  }

  protected async viewPlayers(): Promise<void> {
    await this.router.navigate(['/players'], {
      queryParams: { version: this.league.version, leagueId: this.league.leagueId },
    });
    this.dialog.close();
  }

  protected async viewReferees(): Promise<void> {
    await this.router.navigate(['/referees'], {
      queryParams: { version: this.league.version, leagueId: this.league.leagueId },
    });
    this.dialog.close();
  }
}
