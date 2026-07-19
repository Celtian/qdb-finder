import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

interface DocPage {
  eyebrow: string;
  title: string;
  lead: string;
  sections: { title: string; body: string; code?: string }[];
}
const sections = (first: string, second: string, code?: string): DocPage['sections'] => [
  { title: first, body: second, code },
];
const pages: Record<string, DocPage> = {
  overview: {
    eyebrow: 'QDB Finder',
    title: 'Search thirteen FIFA databases in one place',
    lead: 'A fast, read-only FIFA browser built with Angular, Electron and SQLite FTS5.',
    sections: [
      {
        title: 'Designed for discovery',
        body: 'Use the responsive home and navigation menu to browse player, team, league, referee and stadium editions, then combine edition-specific filters and inspect complete details.',
      },
      {
        title: 'Local by default',
        body: 'The complete optimized database ships with the app. Searches stay on your computer and need no account or connection.',
      },
    ],
  },
  installation: {
    eyebrow: 'Getting started',
    title: 'Install QDB Finder',
    lead: 'Windows x64 is the first supported desktop target.',
    sections: sections(
      'GitHub Releases',
      'Download the latest Squirrel installer or portable ZIP from GitHub Releases. Initial builds are unsigned, so Windows SmartScreen may display a warning.',
    ),
  },
  searching: {
    eyebrow: 'User guide',
    title: 'Searching and filtering',
    lead: 'Start broad, then narrow every supported entity edition inside SQLite.',
    sections: [
      {
        title: 'Players',
        body: 'Search player and alternate names, clubs, countries or leagues. Filter FIFA edition, gender, position, age, overall and potential, or open an exact squad from a team or league. Women player data is available from FIFA 16.',
      },
      {
        title: 'Teams and leagues',
        body: 'Compare edition-specific squads and ratings or browse leagues by country and tier. Detail dialogs preview related records and link to complete filtered results.',
      },
      {
        title: 'Referees and stadiums',
        body: 'Browse referee assignments, nationalities, gender and historical source fields, or compare stadium capacity, pitch dimensions and linked teams. Women referee data is available from FIFA 16, and exact-edition links preserve the selected FIFA context.',
      },
    ],
  },
  'supported-data': {
    eyebrow: 'Data coverage',
    title: 'FIFA 11 through FIFA 23',
    lead: 'Every supplied table covered by fifatables 0.2.10 is preserved.',
    sections: sections(
      'Verified schemas',
      '306 files across 25 definitions become typed raw tables. The canonical layer expects 227,572 player editions, 8,907 team editions, 560 league editions, 2,516 referee editions, 1,371 stadium editions, 3,001 referee-league links, 8,890 stadium-team links and 241,640 team-player links.',
    ),
  },
  development: {
    eyebrow: 'Contributing',
    title: 'Development commands',
    lead: 'Node 24.18 and Yarn Classic 1.22.22 are the supported toolchain.',
    sections: sections(
      'Run and verify',
      'Generate the database before starting Electron; run all checks before release.',
      'yarn install --frozen-lockfile\nyarn db:build\nyarn start\n\nyarn lint\nyarn format:check\nyarn test\nyarn build',
    ),
  },
  database: {
    eyebrow: 'Importer',
    title: 'Deterministic database generation',
    lead: 'Release builds generate SQLite from the checked-in UTF-16LE TSV files.',
    sections: sections(
      'Build and validate',
      'Headers are checked against fifatables before raw tables, canonical indexes and FTS5 are generated. Integrity, foreign-key, ANALYZE and VACUUM checks finish the build.',
      'yarn db:build\nyarn db:validate',
    ),
  },
  licensing: {
    eyebrow: 'Legal',
    title: 'Licensing and data',
    lead: 'Application code and the three FIFA helper libraries are MIT licensed.',
    sections: sections(
      'Data redistribution',
      'Redistributors remain responsible for confirming that supplied FIFA game database content may legally be shipped in their jurisdiction.',
    ),
  },
  releases: {
    eyebrow: 'Distribution',
    title: 'GitHub Releases',
    lead: 'Version tags create reproducible Windows x64 artifacts and static documentation.',
    sections: sections(
      'Release flow',
      'A matching v* tag installs from yarn.lock, generates and validates SQLite, runs checks, creates Squirrel and ZIP artifacts and publishes a draft release. Optional code-signing secrets can be added later.',
    ),
  },
};

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly page = computed(() => pages[String(this.data()['slug'] ?? 'overview')]);
}
