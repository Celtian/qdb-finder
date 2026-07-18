import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Qdb } from '../../core/qdb';
import type { DatabaseInfo } from '../../core/qdb-contracts';

interface HomeTile {
  title: string;
  description: string;
  icon: string;
  route: string;
  count: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly qdb = inject(Qdb);
  protected readonly info = signal<DatabaseInfo | undefined>(undefined);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly tiles = computed<HomeTile[]>(() => {
    const info = this.info();
    if (!info) return [];
    return [
      {
        title: 'Players',
        description: 'Search ratings, positions, nationalities and complete FIFA histories.',
        icon: 'groups',
        route: '/players',
        count: info.editions,
      },
      {
        title: 'Teams',
        description: 'Compare squads and team ratings for every available edition.',
        icon: 'shield',
        route: '/teams',
        count: info.teamEditions,
      },
      {
        title: 'Leagues',
        description: 'Browse competitions, countries, tiers, teams and player counts.',
        icon: 'emoji_events',
        route: '/leagues',
        count: info.leagueEditions,
      },
      {
        title: 'Referees',
        description: 'Explore officials, nationalities, league assignments and FIFA histories.',
        icon: 'sports',
        route: '/referees',
        count: info.refereeEditions,
      },
      {
        title: 'Stadiums',
        description: 'Compare grounds, capacities, pitch sizes and linked teams by edition.',
        icon: 'stadium',
        route: '/stadiums',
        count: info.stadiumEditions,
      },
    ];
  });

  constructor() {
    void this.load();
  }

  protected retry(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.info.set(await this.qdb.getDatabaseInfo());
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Database information is unavailable.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
