import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { scoreBadgeClass } from '../../core/attribute-value';
import { Qdb } from '../../core/qdb';
import { CountryFlag } from '../../core/country-flag/country-flag';
import {
  defaultSearchRequest,
  type FilterKind,
  type FilterSuggestion,
  type Gender,
  type LeagueDetails,
  type PlayerSearchRow,
  type SearchResultPage,
  type SortField,
  type TeamDetails,
} from '../../core/qdb-contracts';
import { PlayerDetail } from '../player-detail/player-detail';
import { map } from 'rxjs';
import { positionBadgeClass } from '../../core/position';

type ExactFilterField = 'nationalities' | 'teams' | 'leagues';
type GenderFilter = 'all' | Gender;

interface FilterDisplay {
  key: string;
  label: string;
  nationalityCode?: string;
}

interface PositionDisplay {
  value: string;
  className: string;
}

interface PlayerSearchDisplay extends PlayerSearchRow {
  teamsLabel: string;
  positionDisplays: PositionDisplay[];
  overallClass: string;
  potentialClass: string;
  bestRatingClass: string;
}

const playerSearchDisplay = (row: PlayerSearchRow): PlayerSearchDisplay => ({
  ...row,
  teamsLabel: row.teams.join(', ') || 'Free agent',
  positionDisplays: row.positions.map((value) => ({
    value,
    className: positionBadgeClass(value),
  })),
  overallClass: scoreBadgeClass(row.overall),
  potentialClass: scoreBadgeClass(row.potential),
  bestRatingClass: `rating ${positionBadgeClass(row.bestPosition)}`,
});
const validVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};
const validId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

@Component({
  selector: 'app-player-finder',
  imports: [
    FormField,
    CountryFlag,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './player-finder.html',
  styleUrl: './player-finder.css',
})
export class PlayerFinder {
  private readonly qdb = inject(Qdb);
  private readonly dialog = inject(MatDialog);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private requestSequence = 0;
  private debounceId?: ReturnType<typeof setTimeout>;
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal(this.initialRequest());
  protected readonly result = signal<SearchResultPage>({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  });
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly context = signal<TeamDetails | LeagueDetails | undefined>(undefined);
  protected readonly contextKind = signal<'team' | 'league' | undefined>(undefined);
  protected readonly columns = [
    'name',
    'originalId',
    'version',
    'nationality',
    'teams',
    'positions',
    'age',
    'overall',
    'potential',
    'bestRating',
  ];
  protected readonly versions = Array.from({ length: 13 }, (_, index) => 23 - index);
  protected readonly positions = [
    'GK',
    'RB',
    'CB',
    'LB',
    'CDM',
    'CM',
    'CAM',
    'RM',
    'LM',
    'RW',
    'LW',
    'CF',
    'ST',
  ];
  protected readonly positionOptions: PositionDisplay[] = this.positions.map((value) => ({
    value,
    className: positionBadgeClass(value),
  }));
  protected readonly suggestions = signal<Record<FilterKind, FilterSuggestion[]>>({
    nationality: [],
    team: [],
    league: [],
  });
  protected readonly filterLabels = signal<Record<ExactFilterField, Record<string, string>>>({
    nationalities: {},
    teams: {},
    leagues: {},
  });
  protected readonly nationalityCodes = signal<Record<string, string>>({});
  protected readonly selectedNationalities = computed<FilterDisplay[]>(() =>
    this.request().nationalities.map((key) => ({
      key,
      label: this.filterLabels().nationalities[key] ?? key,
      nationalityCode: this.nationalityCodes()[key],
    })),
  );
  protected readonly selectedTeams = computed<FilterDisplay[]>(() =>
    this.request().teams.map((key) => ({
      key,
      label: this.filterLabels().teams[key] ?? key,
    })),
  );
  protected readonly selectedLeagues = computed<FilterDisplay[]>(() =>
    this.request().leagues.map((key) => ({
      key,
      label: this.filterLabels().leagues[key] ?? key,
    })),
  );
  protected readonly selectedPositions = computed<PositionDisplay[]>(() =>
    this.request().positions.map((value) => ({
      value,
      className: positionBadgeClass(value),
    })),
  );
  protected readonly resultRows = computed<PlayerSearchDisplay[]>(() =>
    this.result().rows.map(playerSearchDisplay),
  );
  protected readonly isNarrow = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly hasFilters = computed(() => {
    const value = this.request();
    return Boolean(
      value.text ||
      value.versions.length ||
      value.gender !== undefined ||
      value.nationalities.length ||
      value.teams.length ||
      value.leagues.length ||
      value.positions.length ||
      value.teamEdition ||
      value.leagueEdition ||
      Object.keys(value.age).length ||
      Object.keys(value.overall).length ||
      Object.keys(value.potential).length,
    );
  });

  constructor() {
    effect(() => {
      const text = this.model().text;
      clearTimeout(this.debounceId);
      this.debounceId = setTimeout(() => {
        this.request.update((value) => ({ ...value, text, offset: 0 }));
        void this.search();
      }, 250);
    });
    void this.loadContext();
  }

  protected setVersions(versions: number[]): void {
    this.request.update((value) => ({ ...value, versions, offset: 0 }));
    void this.search();
  }
  protected setGender(gender: GenderFilter): void {
    this.request.update((value) => ({
      ...value,
      gender: gender === 'all' ? undefined : gender,
      offset: 0,
    }));
    void this.search();
  }
  protected setPositions(positions: string[]): void {
    this.request.update((value) => ({ ...value, positions, offset: 0 }));
    void this.search();
  }
  protected setRange(
    kind: 'age' | 'overall' | 'potential',
    boundary: 'min' | 'max',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const number = raw === '' ? undefined : Number(raw);
    this.request.update((value) => ({
      ...value,
      [kind]: { ...value[kind], [boundary]: number },
      offset: 0,
    }));
    void this.search();
  }
  protected retrySearch(): void {
    void this.search();
  }
  protected async suggest(kind: FilterKind, event: Event): Promise<void> {
    const text = (event.target as HTMLInputElement).value;
    const options = await this.qdb.suggestFilters({
      kind,
      text,
      versions: this.request().versions,
      limit: 12,
    });
    this.suggestions.update((value) => ({ ...value, [kind]: options }));
  }
  protected addExactFilter(
    field: ExactFilterField,
    option: FilterSuggestion,
    input: HTMLInputElement,
  ): void {
    const { key, label } = option;
    this.request.update((value) => ({
      ...value,
      [field]: [...new Set([...value[field], key])],
      offset: 0,
    }));
    this.filterLabels.update((value) => ({
      ...value,
      [field]: { ...value[field], [key]: label },
    }));
    if (field === 'nationalities' && option.nationalityCode)
      this.nationalityCodes.update((value) => ({
        ...value,
        [key]: option.nationalityCode ?? '',
      }));
    input.value = '';
    void this.search();
  }
  protected removeExactFilter(field: ExactFilterField, key: string): void {
    this.request.update((value) => ({
      ...value,
      [field]: value[field].filter((item) => item !== key),
      offset: 0,
    }));
    this.filterLabels.update((value) => ({
      ...value,
      [field]: Object.fromEntries(
        Object.entries(value[field]).filter(([labelKey]) => labelKey !== key),
      ),
    }));
    if (field === 'nationalities')
      this.nationalityCodes.update((value) =>
        Object.fromEntries(Object.entries(value).filter(([codeKey]) => codeKey !== key)),
      );
    void this.search();
  }
  protected filterLabel(field: ExactFilterField, key: string): string {
    return this.filterLabels()[field][key] ?? key;
  }
  protected nationalityCode(key: string): string {
    return this.nationalityCodes()[key] ?? '';
  }
  protected clearFilters(): void {
    this.model.set({ text: '' });
    this.request.set(defaultSearchRequest());
    this.filterLabels.set({ nationalities: {}, teams: {}, leagues: {} });
    this.nationalityCodes.set({});
    this.context.set(undefined);
    this.contextKind.set(undefined);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
  }
  protected page(event: PageEvent): void {
    this.request.update((value) => ({
      ...value,
      pageSize: event.pageSize,
      offset: event.pageIndex * event.pageSize,
    }));
    void this.search();
  }
  protected sort(event: Sort): void {
    const direction = event.direction;
    if (!direction) return;
    this.request.update((value) => ({
      ...value,
      sort: event.active as SortField,
      direction,
      offset: 0,
    }));
    void this.search();
  }
  protected async openPlayer(row: PlayerSearchRow): Promise<void> {
    const player = await this.qdb.getPlayer(row);
    this.dialog.open(PlayerDetail, {
      data: player,
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
    });
  }

  private initialRequest() {
    const request = defaultSearchRequest();
    const params = this.route.snapshot.queryParamMap;
    const version = validVersion(params.get('version'));
    const teamId = validId(params.get('teamId'));
    const leagueId = validId(params.get('leagueId'));
    if (!version || Boolean(teamId) === Boolean(leagueId)) return request;
    if (teamId) return { ...request, versions: [version], teamEdition: { version, teamId } };
    if (leagueId) return { ...request, versions: [version], leagueEdition: { version, leagueId } };
    return request;
  }

  private async loadContext(): Promise<void> {
    try {
      if (this.request().teamEdition) {
        const team = this.request().teamEdition;
        if (!team) return;
        this.context.set(await this.qdb.getTeam(team));
        this.contextKind.set('team');
      } else if (this.request().leagueEdition) {
        const league = this.request().leagueEdition;
        if (!league) return;
        this.context.set(await this.qdb.getLeague(league));
        this.contextKind.set('league');
      }
    } catch {
      this.request.update((value) => ({
        ...value,
        teamEdition: undefined,
        leagueEdition: undefined,
      }));
    }
  }

  private async search(): Promise<void> {
    const sequence = ++this.requestSequence;
    this.loading.set(true);
    this.error.set('');
    try {
      const page = await this.qdb.searchPlayers(this.request());
      if (sequence === this.requestSequence) this.result.set(page);
    } catch (error) {
      if (sequence === this.requestSequence)
        this.error.set(
          error instanceof Error ? error.message : 'The database could not be searched.',
        );
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }
}
