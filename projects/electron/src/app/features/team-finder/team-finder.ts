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
import { AppNavigationTrigger } from '../../core/app-navigation-trigger/app-navigation-trigger';
import { scoreBadgeClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import { DatabaseContext } from '../../core/database-context';
import { DatabaseFilter } from '../../core/database-filter/database-filter';
import { databaseVersions } from '../../core/database-filter/database-filter-options';
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
import { Qdb } from '../../core/qdb';
import {
  defaultTeamSearchRequest,
  type EntityFacetOption,
  type LeagueEditionRow,
  type PlayerDetails,
  type StadiumEditionRow,
  type TeamEditionRow,
  type TeamResultPage,
  type TeamSearchRequest,
  type TeamSortField,
} from '../../core/qdb-contracts';
import { TeamDetail } from '../team-detail/team-detail';

interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

type TeamFacet = 'league' | 'country';

interface TeamDisplay extends TeamEditionRow {
  overallClass: string;
  attackClass: string;
  midfieldClass: string;
  defenceClass: string;
}

const scoreClass = (value: number | null): string => (value === null ? '' : scoreBadgeClass(value));
const teamDisplay = (row: TeamEditionRow): TeamDisplay => ({
  ...row,
  overallClass: scoreClass(row.overall),
  attackClass: scoreClass(row.attack),
  midfieldClass: scoreClass(row.midfield),
  defenceClass: scoreClass(row.defence),
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
  selector: 'app-team-finder',
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
  templateUrl: './team-finder.html',
  styleUrl: './team-finder.css',
})
export class TeamFinder {
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preferences = inject(FinderPreferences);
  private readonly routeRequest = this.initialContextRequest();
  private readonly savedFilters = this.routeRequest
    ? undefined
    : this.preferences.loadFilters('teams');
  private readonly initialRequestState = this.routeRequest ?? this.restoredRequest();
  private requestSequence = 0;
  private filterDialogRef?: MatDialogRef<unknown>;
  private readonly filterDrawer = viewChild.required<TemplateRef<unknown>>('filterDrawer');
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal<TeamSearchRequest>(
    this.cloneRequest(this.initialRequestState),
  );
  protected readonly draftRequest = signal<TeamSearchRequest>(
    this.cloneRequest(this.initialRequestState),
  );
  protected readonly result = signal<TeamResultPage>({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  });
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly contextPlayer = signal<PlayerDetails | undefined>(undefined);
  protected readonly contextLeague = signal<LeagueEditionRow | undefined>(undefined);
  protected readonly contextStadium = signal<StadiumEditionRow | undefined>(undefined);
  protected readonly columnDefinitions = finderColumns.teams;
  protected readonly columns = signal<readonly FinderColumnKey[]>(
    this.preferences.loadColumns('teams'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.draftRequest().databaseIds),
  );
  protected readonly ratingFilters = [
    { key: 'overall', label: 'Overall' },
    { key: 'attack', label: 'Attack' },
    { key: 'midfield', label: 'Midfield' },
    { key: 'defence', label: 'Defence' },
  ] as const;
  protected readonly suggestions = signal<Record<'league' | 'country', EntityFacetOption[]>>({
    league: [],
    country: [],
  });
  protected readonly labels = signal<Record<'league' | 'country', Record<string, FilterDisplay>>>(
    structuredClone(this.savedFilters?.labels ?? { league: {}, country: {} }),
  );
  private appliedLabels: Record<'league' | 'country', Record<string, FilterDisplay>> = {
    league: { ...(this.savedFilters?.labels.league ?? {}) },
    country: { ...(this.savedFilters?.labels.country ?? {}) },
  };
  protected readonly selectedLeagues = computed(() =>
    this.draftRequest().leagueKeys.map(
      (key): FilterDisplay => this.labels().league[key] ?? { key, label: key },
    ),
  );
  protected readonly selectedCountries = computed(() =>
    this.draftRequest().countryIds.map((id): FilterDisplay => {
      const key = String(id);
      return this.labels().country[key] ?? { key, label: key };
    }),
  );
  protected readonly rows = computed(() => this.result().rows.map(teamDisplay));
  protected readonly activeFilterCount = computed(() => this.filterCount(this.request()));
  protected readonly draftHasFilters = computed(() => this.filterCount(this.draftRequest()) > 0);
  protected readonly resultStatus = computed(() =>
    this.loading() ? 'Searching teams…' : `${this.result().total.toLocaleString()} team editions`,
  );

  private filterCount(request: TeamSearchRequest): number {
    return [
      request.databaseIds.length > 0,
      request.versions.length > 0,
      request.leagueKeys.length > 0,
      request.countryIds.length > 0,
      Boolean(request.playerEdition || request.leagueEdition || request.stadiumEdition),
      Object.keys(request.overall).length > 0,
      Object.keys(request.attack).length > 0,
      Object.keys(request.midfield).length > 0,
      Object.keys(request.defence).length > 0,
    ].filter(Boolean).length;
  }

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
      untracked(() => void this.search());
    });
    const playerContext = this.request().playerEdition;
    if (playerContext) void this.loadContextPlayer(playerContext);
    const context = this.request().leagueEdition;
    if (context) void this.loadContextLeague(context);
    const stadiumContext = this.request().stadiumEdition;
    if (stadiumContext) void this.loadContextStadium(stadiumContext);
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
      playerEdition: undefined,
      leagueEdition: undefined,
      stadiumEdition: undefined,
    }));
  }

  protected setRange(
    kind: 'overall' | 'attack' | 'midfield' | 'defence',
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

  protected async suggest(facet: TeamFacet, event: Event): Promise<void> {
    const text = (event.target as HTMLInputElement).value;
    const options = await this.qdb.suggestEntityFacets({
      databaseIds: this.draftRequest().databaseIds,
      entity: 'team',
      facet,
      text,
      versions: this.draftRequest().versions,
      limit: 20,
    });
    this.suggestions.update((value) => ({ ...value, [facet]: options }));
  }

  protected addFacet(facet: TeamFacet, option: EntityFacetOption, input: HTMLInputElement): void {
    if (facet === 'league')
      this.draftRequest.update((value) => ({
        ...value,
        leagueKeys: [...new Set([...value.leagueKeys, option.key])],
      }));
    else if (option.id !== undefined) {
      const id = option.id;
      this.draftRequest.update((value) => ({
        ...value,
        countryIds: [...new Set([...value.countryIds, id])],
      }));
    }
    this.labels.update((value) => ({
      ...value,
      [facet]: {
        ...value[facet],
        [option.key]: {
          key: option.key,
          label: option.label,
          countryCode: option.countryCode,
        },
      },
    }));
    input.value = '';
  }

  protected removeFacet(facet: TeamFacet, key: string): void {
    if (facet === 'league')
      this.draftRequest.update((value) => ({
        ...value,
        leagueKeys: value.leagueKeys.filter((item) => item !== key),
      }));
    else
      this.draftRequest.update((value) => ({
        ...value,
        countryIds: value.countryIds.filter((item) => item !== Number(key)),
      }));
  }

  protected clearFilters(): void {
    const current = this.request();
    this.request.set({
      ...defaultTeamSearchRequest(),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
    });
    this.labels.set({ league: {}, country: {} });
    this.appliedLabels = { league: {}, country: {} };
    this.contextPlayer.set(undefined);
    this.contextLeague.set(undefined);
    this.contextStadium.set(undefined);
    this.preferences.clearFilters('teams');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
  }

  protected clearDraftFilters(): void {
    const current = this.draftRequest();
    this.draftRequest.set({
      ...defaultTeamSearchRequest(),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
    });
    this.labels.set({ league: {}, country: {} });
  }

  protected retrySearch(): void {
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
      sort: event.active as TeamSortField,
      direction,
      offset: 0,
    }));
    void this.search();
  }

  protected openFilters(): void {
    this.draftRequest.set(this.cloneRequest(this.request()));
    this.labels.set({
      league: { ...this.appliedLabels.league },
      country: { ...this.appliedLabels.country },
    });
    this.filterDialogRef = this.dialog.open(
      this.filterDrawer(),
      finderFilterDialogConfig('team-filter-title'),
    );
  }

  protected applyFilters(): void {
    const current = this.request();
    const draft = this.draftRequest();
    const databaseChanged = current.databaseIds.join('\u0000') !== draft.databaseIds.join('\u0000');
    const contextCleared = Boolean(
      (current.playerEdition && !draft.playerEdition) ||
      (current.leagueEdition && !draft.leagueEdition) ||
      (current.stadiumEdition && !draft.stadiumEdition),
    );
    this.request.set({
      ...this.cloneRequest(draft),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
      offset: 0,
    });
    this.appliedLabels = {
      league: { ...this.labels().league },
      country: { ...this.labels().country },
    };
    this.persistFilters();
    if (databaseChanged || contextCleared) {
      this.contextPlayer.set(undefined);
      this.contextLeague.set(undefined);
      this.contextStadium.set(undefined);
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
            finder: 'teams',
            columns: this.columnDefinitions,
            preference: this.preferences.loadColumnPreference('teams'),
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

  protected async openTeam(row: TeamEditionRow): Promise<void> {
    const team = await this.qdb.getTeam(row);
    this.dialog.open(TeamDetail, {
      data: team,
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
    });
  }

  private applyColumns(preference: FinderColumnPreference): void {
    const columns = visibleFinderColumns(preference);
    this.preferences.saveColumnPreference('teams', preference);
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

  private cloneRequest(value: TeamSearchRequest): TeamSearchRequest {
    return {
      ...value,
      databaseIds: [...value.databaseIds],
      versions: [...value.versions],
      leagueKeys: [...value.leagueKeys],
      countryIds: [...value.countryIds],
      overall: { ...value.overall },
      attack: { ...value.attack },
      midfield: { ...value.midfield },
      defence: { ...value.defence },
    };
  }

  private initialContextRequest(): TeamSearchRequest | undefined {
    const request = defaultTeamSearchRequest();
    const databaseId = this.route.snapshot.queryParamMap.get('databaseId') ?? 'built-in';
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const playerId = validId(this.route.snapshot.queryParamMap.get('playerId'));
    const leagueId = validId(this.route.snapshot.queryParamMap.get('leagueId'));
    const stadiumId = validId(this.route.snapshot.queryParamMap.get('stadiumId'));
    const contextCount = [playerId, leagueId, stadiumId].filter(
      (value) => value !== undefined,
    ).length;
    if (!version || contextCount !== 1) return undefined;
    if (playerId)
      return {
        ...request,
        databaseIds: [databaseId],
        versions: [version],
        playerEdition: { databaseId, version, playerId },
      };
    if (leagueId)
      return {
        ...request,
        databaseIds: [databaseId],
        versions: [version],
        leagueEdition: { databaseId, version, leagueId },
      };
    if (stadiumId)
      return {
        ...request,
        databaseIds: [databaseId],
        versions: [version],
        stadiumEdition: { databaseId, version, stadiumId },
      };
    return undefined;
  }

  private restoredRequest(): TeamSearchRequest {
    const filters = this.savedFilters;
    if (!filters) return defaultTeamSearchRequest();
    return {
      ...defaultTeamSearchRequest(),
      databaseIds: [...filters.databaseIds],
      versions: [...filters.versions],
      leagueKeys: [...filters.leagueKeys],
      countryIds: [...filters.countryIds],
      overall: { ...filters.overall },
      attack: { ...filters.attack },
      midfield: { ...filters.midfield },
      defence: { ...filters.defence },
    };
  }

  private persistFilters(): void {
    const request = this.request();
    this.preferences.saveFilters('teams', {
      databaseIds: [...request.databaseIds],
      versions: [...request.versions],
      leagueKeys: [...request.leagueKeys],
      countryIds: [...request.countryIds],
      overall: { ...request.overall },
      attack: { ...request.attack },
      midfield: { ...request.midfield },
      defence: { ...request.defence },
      labels: structuredClone(this.appliedLabels),
    });
  }

  private async loadContextPlayer(
    key: NonNullable<TeamSearchRequest['playerEdition']>,
  ): Promise<void> {
    try {
      this.contextPlayer.set(await this.qdb.getPlayer(key));
    } catch {
      this.request.update((value) => ({ ...value, playerEdition: undefined }));
    }
  }

  private async loadContextLeague(
    key: NonNullable<TeamSearchRequest['leagueEdition']>,
  ): Promise<void> {
    try {
      this.contextLeague.set(await this.qdb.getLeague(key));
    } catch {
      this.request.update((value) => ({ ...value, leagueEdition: undefined }));
    }
  }

  private async loadContextStadium(
    key: NonNullable<TeamSearchRequest['stadiumEdition']>,
  ): Promise<void> {
    try {
      this.contextStadium.set(await this.qdb.getStadium(key));
    } catch {
      this.request.update((value) => ({ ...value, stadiumEdition: undefined }));
    }
  }

  private async search(): Promise<void> {
    const sequence = ++this.requestSequence;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.qdb.searchTeams(this.request());
      if (sequence === this.requestSequence) this.result.set(result);
    } catch (error) {
      if (sequence === this.requestSequence)
        this.error.set(error instanceof Error ? error.message : 'Team search failed.');
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }
}
