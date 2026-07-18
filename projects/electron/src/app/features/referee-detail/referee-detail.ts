import { KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CountryFlag } from '../../core/country-flag/country-flag';
import type { RefereeDetails } from '../../core/qdb-contracts';

@Component({
  selector: 'app-referee-detail',
  imports: [
    KeyValuePipe,
    CountryFlag,
    MatButtonModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
  ],
  templateUrl: './referee-detail.html',
  styleUrl: './referee-detail.css',
})
export class RefereeDetail {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialogRef<RefereeDetail>);
  protected readonly referee = inject<RefereeDetails>(MAT_DIALOG_DATA);
  protected readonly realStatus =
    this.referee.isReal === null ? '—' : this.referee.isReal ? 'Yes' : 'No';
  protected readonly metrics = [
    { label: 'Age', value: this.referee.age ?? '—' },
    { label: 'Height', value: this.referee.height === null ? '—' : `${this.referee.height} cm` },
    { label: 'Weight', value: this.referee.weight === null ? '—' : `${this.referee.weight} kg` },
    { label: 'Real referee', value: this.realStatus },
    { label: 'Foul strictness', value: this.referee.foulStrictness ?? '—' },
    { label: 'Card strictness', value: this.referee.cardStrictness ?? '—' },
  ];

  protected async viewLeagues(): Promise<void> {
    await this.router.navigate(['/leagues'], {
      queryParams: { version: this.referee.version, refereeId: this.referee.refereeId },
    });
    this.dialog.close();
  }
}
