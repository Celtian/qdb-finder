import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { scoreBadgeClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import type { StadiumDetails } from '../../core/qdb-contracts';

@Component({
  selector: 'app-stadium-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './stadium-detail.html',
  styleUrl: './stadium-detail.css',
})
export class StadiumDetail {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialogRef<StadiumDetail>);
  protected readonly stadium = inject<StadiumDetails>(MAT_DIALOG_DATA);
  protected readonly licensed =
    this.stadium.isLicensed === null ? '—' : this.stadium.isLicensed ? 'Yes' : 'No';
  protected readonly smallSided =
    this.stadium.isSmallSided === null ? '—' : this.stadium.isSmallSided ? 'Yes' : 'No';
  protected readonly pitch =
    this.stadium.pitchLengthMeters === null || this.stadium.pitchWidthMeters === null
      ? '—'
      : `${this.stadium.pitchLengthMeters} × ${this.stadium.pitchWidthMeters} m`;
  protected readonly teams = this.stadium.teams.map((team) => ({
    ...team,
    overallClass: team.overall === null ? '' : scoreBadgeClass(team.overall),
  }));

  protected async viewTeams(): Promise<void> {
    await this.router.navigate(['/teams'], {
      queryParams: {
        databaseId: this.stadium.databaseId,
        version: this.stadium.version,
        stadiumId: this.stadium.stadiumId,
      },
    });
    this.dialog.close();
  }
}
