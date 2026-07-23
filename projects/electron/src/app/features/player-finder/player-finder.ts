import {
  Component,
  computed,
  effect,
  inject,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, type MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { scoreBadgeClass } from '../../core/attribute-value';
import { Qdb } from '../../core/qdb';
import { CountryFlag } from '../../core/country-flag/country-flag';
import { DatabaseContext } from '../../core/database-context';
import { DatabaseFilter } from '../../core/database-filter/database-filter';
import { databaseVersions } from '../../core/database-filter/database-filter-options';
import { AppNavigationTrigger } from '../../core/app-navigation-trigger/app-navigation-trigger';
import { finderFilterDialogConfig } from '../../core/finder-filter-dialog';
import { FinderFilterDrawer } from '../../core/finder-filter-drawer';
import {
  finderColumns,
  isFinderSortVisible,
  visibleFinderColumns,
  type FinderColumnPreference,
  type FinderColumnKey,
} from '../../core/finder-columns';
import { FinderColumnDrawer, type FinderColumnDrawerData } from '../../core/finder-column-drawer';
import { FinderPreferences } from '../../core/finder-preferences';
import {
  defaultSearchRequest,
  type FilterKind,
  type FilterSuggestion,
  type Gender,
  type LeagueDetails,
  type PlayerSearchRow,
  type SearchRequest,
  type SearchResultPage,
  type SortField,
  type TeamDetails,
} from '../../core/qdb-contracts';
import { PlayerDetail } from '../player-detail/player-detail';
import { positionBadgeClass } from '../../core/position';
import {
  formatDateOnly,
  preferredFootLabel as formatPreferredFoot,
} from '../../core/player-profile-value';

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
  birthDateLabel: string;
  preferredFootLabel: string;
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
  birthDateLabel: formatDateOnly(row.birthDate),
  preferredFootLabel: formatPreferredFoot(row.preferredFoot),
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
    AppNavigationTrigger,
    FormField,
    CountryFlag,
    DatabaseFilter,
    FinderFilterDrawer,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './player-finder.html',
  styleUrl: './player-finder.css',
})
export class PlayerFinder {
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preferences = inject(FinderPreferences);
  private readonly routeRequest = this.initialContextRequest();
  private readonly savedFilters = this.routeRequest
    ? undefined
    : this.preferences.loadFilters('players');
  private readonly initialRequestState = this.routeRequest ?? this.restoredRequest();
  private requestSequence = 0;
  private filterDialogRef?: MatDialogRef<unknown>;
  private readonly filterDrawer = viewChild.required<TemplateRef<unknown>>('filterDrawer');
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal<SearchRequest>(this.cloneRequest(this.initialRequestState));
  protected readonly draftRequest = signal<SearchRequest>(
    this.cloneRequest(this.initialRequestState),
  );
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
  protected readonly columnDefinitions = finderColumns.players;
  protected readonly columns = signal<readonly FinderColumnKey[]>(
    this.preferences.loadColumns('players'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.draftRequest().databaseIds),
  );
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
  protected readonly filterLabels = signal<Record<ExactFilterField, Record<string, string>>>(
    structuredClone(this.savedFilters?.labels ?? { nationalities: {}, teams: {}, leagues: {} }),
  );
  private appliedFilterLabels: Record<ExactFilterField, Record<string, string>> = {
    nationalities: { ...(this.savedFilters?.labels.nationalities ?? {}) },
    teams: { ...(this.savedFilters?.labels.teams ?? {}) },
    leagues: { ...(this.savedFilters?.labels.leagues ?? {}) },
  };
  protected readonly nationalityCodes = signal<Record<string, string>>({
    ...(this.savedFilters?.nationalityCodes ?? {}),
  });
  private appliedNationalityCodes: Record<string, string> = {
    ...(this.savedFilters?.nationalityCodes ?? {}),
  };
  protected readonly selectedNationalities = computed<FilterDisplay[]>(() =>
    this.draftRequest().nationalities.map((key) => ({
      key,
      label: this.filterLabels().nationalities[key] ?? key,
      nationalityCode: this.nationalityCodes()[key],
    })),
  );
  protected readonly selectedTeams = computed<FilterDisplay[]>(() =>
    this.draftRequest().teams.map((key) => ({
      key,
      label: this.filterLabels().teams[key] ?? key,
    })),
  );
  protected readonly selectedLeagues = computed<FilterDisplay[]>(() =>
    this.draftRequest().leagues.map((key) => ({
      key,
      label: this.filterLabels().leagues[key] ?? key,
    })),
  );
  protected readonly selectedPositions = computed<PositionDisplay[]>(() =>
    this.draftRequest().positions.map((value) => ({
      value,
      className: positionBadgeClass(value),
    })),
  );
  protected readonly resultRows = computed<PlayerSearchDisplay[]>(() =>
    this.result().rows.map(playerSearchDisplay),
  );
  protected readonly activeFilterCount = computed(() => this.filterCount(this.request()));
  protected readonly draftHasFilters = computed(() => this.filterCount(this.draftRequest()) > 0);
  protected readonly hasFilters = computed(() => this.activeFilterCount() > 0);

  private filterCount(value: SearchRequest): number {
    return [
      value.databaseIds.length > 0,
      value.versions.length > 0,
      value.gender !== undefined,
      value.nationalities.length > 0,
      value.teams.length > 0,
      value.leagues.length > 0,
      value.positions.length > 0,
      Boolean(value.teamEdition || value.leagueEdition),
      Object.keys(value.age).length > 0,
      Object.keys(value.overall).length > 0,
      Object.keys(value.potential).length > 0,
    ].filter(Boolean).length;
  }

  protected readonly resultStatus = computed(() => {
    if (this.loading()) return 'Searching players…';
    return `${this.result().total.toLocaleString()} player editions`;
  });

  protected readonly hasSearchOrFilters = computed(() => {
    const value = this.request();
    return Boolean(value.text || this.activeFilterCount());
  });

  constructor() {
    if (!isFinderSortVisible(this.columnDefinitions, this.columns(), this.request().sort))
      this.request.update((value) => ({ ...value, sort: 'name', direction: 'asc', offset: 0 }));
    effect((onCleanup) => {
      const text = this.model().text;
      const debounceId = setTimeout(() => {
        this.request.update((value) => ({ ...value, text, offset: 0 }));
        void this.search();
      }, 250);
      onCleanup(() => clearTimeout(debounceId));
    });
    effect(() => {
      if (!this.databaseContext.revision()) return;
      untracked(() => {
        void this.loadContext();
        void this.search();
      });
    });
    void this.loadContext();
  }

  protected setVersions(versions: number[]): void {
    this.draftRequest.update((value) => ({ ...value, versions }));
  }
  protected setDatabases(databaseIds: string[]): void {
    const availableVersions = databaseVersions(this.databases(), databaseIds);
    this.draftRequest.update((value) => ({
      ...value,
      databaseIds,
      versions: value.versions.filter((version) => availableVersions.includes(version)),
      teamEdition: undefined,
      leagueEdition: undefined,
    }));
  }
  protected setGender(gender: GenderFilter): void {
    this.draftRequest.update((value) => ({
      ...value,
      gender: gender === 'all' ? undefined : gender,
    }));
  }
  protected setPositions(positions: string[]): void {
    this.draftRequest.update((value) => ({ ...value, positions }));
  }
  protected setRange(
    kind: 'age' | 'overall' | 'potential',
    boundary: 'min' | 'max',
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const number = raw === '' ? undefined : Number(raw);
    this.draftRequest.update((value) => ({
      ...value,
      [kind]: { ...value[kind], [boundary]: number },
    }));
  }
  protected retrySearch(): void {
    void this.search();
  }
  protected async suggest(kind: FilterKind, event: Event): Promise<void> {
    const text = (event.target as HTMLInputElement).value;
    const options = await this.qdb.suggestFilters({
      databaseIds: this.draftRequest().databaseIds,
      kind,
      text,
      versions: this.draftRequest().versions,
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
    this.draftRequest.update((value) => ({
      ...value,
      [field]: [...new Set([...value[field], key])],
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
  }
  protected removeExactFilter(field: ExactFilterField, key: string): void {
    this.draftRequest.update((value) => ({
      ...value,
      [field]: value[field].filter((item) => item !== key),
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
  }
  protected filterLabel(field: ExactFilterField, key: string): string {
    return this.filterLabels()[field][key] ?? key;
  }
  protected nationalityCode(key: string): string {
    return this.nationalityCodes()[key] ?? '';
  }
  protected clearFilters(): void {
    const current = this.request();
    this.request.set({
      ...defaultSearchRequest(),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
    });
    this.filterLabels.set({ nationalities: {}, teams: {}, leagues: {} });
    this.appliedFilterLabels = { nationalities: {}, teams: {}, leagues: {} };
    this.nationalityCodes.set({});
    this.appliedNationalityCodes = {};
    this.context.set(undefined);
    this.contextKind.set(undefined);
    this.preferences.clearFilters('players');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
  }
  protected clearDraftFilters(): void {
    const value = this.draftRequest();
    this.draftRequest.set({
      ...defaultSearchRequest(),
      text: value.text,
      sort: value.sort,
      direction: value.direction,
      pageSize: value.pageSize,
    });
    this.filterLabels.set({ nationalities: {}, teams: {}, leagues: {} });
    this.nationalityCodes.set({});
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
  protected openFilters(): void {
    this.draftRequest.set(this.cloneRequest(this.request()));
    this.filterLabels.set({
      nationalities: { ...this.appliedFilterLabels.nationalities },
      teams: { ...this.appliedFilterLabels.teams },
      leagues: { ...this.appliedFilterLabels.leagues },
    });
    this.nationalityCodes.set({ ...this.appliedNationalityCodes });
    this.filterDialogRef = this.dialog.open(
      this.filterDrawer(),
      finderFilterDialogConfig('player-filter-title'),
    );
  }
  protected applyFilters(): void {
    const current = this.request();
    const draft = this.draftRequest();
    const databaseChanged = current.databaseIds.join('\u0000') !== draft.databaseIds.join('\u0000');
    const contextCleared = Boolean(
      (current.teamEdition && !draft.teamEdition) ||
      (current.leagueEdition && !draft.leagueEdition),
    );
    this.request.set({
      ...this.cloneRequest(draft),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
      offset: 0,
    });
    this.appliedFilterLabels = {
      nationalities: { ...this.filterLabels().nationalities },
      teams: { ...this.filterLabels().teams },
      leagues: { ...this.filterLabels().leagues },
    };
    this.appliedNationalityCodes = { ...this.nationalityCodes() };
    this.persistFilters();
    if (databaseChanged || contextCleared) {
      this.context.set(undefined);
      this.contextKind.set(undefined);
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
    this.filterDialogRef?.close();
    void this.search();
  }
  protected openColumns(): void {
    this.dialog
      .open<FinderColumnDrawer, FinderColumnDrawerData, FinderColumnPreference>(
        FinderColumnDrawer,
        {
          ariaLabelledBy: 'finder-column-title',
          ariaModal: true,
          autoFocus: 'first-tabbable',
          data: {
            finder: 'players',
            columns: this.columnDefinitions,
            preference: this.preferences.loadColumnPreference('players'),
          },
          delayFocusTrap: false,
          disableClose: false,
          height: '100vh',
          maxHeight: '100vh',
          maxWidth: '100vw',
          panelClass: 'finder-column-drawer-panel',
          position: { right: '0', top: '0' },
          restoreFocus: true,
          width: '28rem',
        },
      )
      .afterClosed()
      .subscribe((preference) => {
        if (preference) this.applyColumns(preference);
      });
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

  private applyColumns(preference: FinderColumnPreference): void {
    const columns = visibleFinderColumns(preference);
    this.preferences.saveColumnPreference('players', preference);
    this.columns.set(columns);
    if (isFinderSortVisible(this.columnDefinitions, columns, this.request().sort)) return;
    this.request.update((value) => ({
      ...value,
      sort: 'name',
      direction: 'asc',
      offset: 0,
    }));
    void this.search();
  }

  private cloneRequest(value: SearchRequest): SearchRequest {
    return {
      ...value,
      databaseIds: [...value.databaseIds],
      versions: [...value.versions],
      nationalities: [...value.nationalities],
      teams: [...value.teams],
      leagues: [...value.leagues],
      positions: [...value.positions],
      age: { ...value.age },
      overall: { ...value.overall },
      potential: { ...value.potential },
    };
  }

  private initialContextRequest(): SearchRequest | undefined {
    const request = defaultSearchRequest();
    const params = this.route.snapshot.queryParamMap;
    const databaseId = params.get('databaseId') ?? 'built-in';
    const version = validVersion(params.get('version'));
    const teamId = validId(params.get('teamId'));
    const leagueId = validId(params.get('leagueId'));
    if (!version || Boolean(teamId) === Boolean(leagueId)) return undefined;
    if (teamId)
      return {
        ...request,
        databaseIds: [databaseId],
        versions: [version],
        teamEdition: { databaseId, version, teamId },
      };
    if (leagueId)
      return {
        ...request,
        databaseIds: [databaseId],
        versions: [version],
        leagueEdition: { databaseId, version, leagueId },
      };
    return undefined;
  }

  private restoredRequest(): SearchRequest {
    const filters = this.savedFilters;
    if (!filters) return defaultSearchRequest();
    return {
      ...defaultSearchRequest(),
      databaseIds: [...filters.databaseIds],
      versions: [...filters.versions],
      gender: filters.gender,
      nationalities: [...filters.nationalities],
      teams: [...filters.teams],
      leagues: [...filters.leagues],
      positions: [...filters.positions],
      age: { ...filters.age },
      overall: { ...filters.overall },
      potential: { ...filters.potential },
    };
  }

  private persistFilters(): void {
    const request = this.request();
    this.preferences.saveFilters('players', {
      databaseIds: [...request.databaseIds],
      versions: [...request.versions],
      gender: request.gender,
      nationalities: [...request.nationalities],
      teams: [...request.teams],
      leagues: [...request.leagues],
      positions: [...request.positions],
      age: { ...request.age },
      overall: { ...request.overall },
      potential: { ...request.potential },
      labels: structuredClone(this.appliedFilterLabels),
      nationalityCodes: { ...this.appliedNationalityCodes },
    });
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
