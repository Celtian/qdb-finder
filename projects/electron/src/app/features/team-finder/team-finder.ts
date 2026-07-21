import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { map } from 'rxjs';
import { scoreBadgeClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import { DatabaseContext } from '../../core/database-context';
import { DatabaseFilter } from '../../core/database-filter/database-filter';
import { databaseVersions } from '../../core/database-filter/database-filter-options';
import {
  defaultFinderColumns,
  finderColumns,
  isFinderSortVisible,
  type FinderColumnKey,
} from '../../core/finder-columns';
import { FinderColumnDrawer, type FinderColumnDrawerData } from '../../core/finder-column-drawer';
import { FinderColumnPreferences } from '../../core/finder-column-preferences';
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
    FormField,
    CountryFlag,
    DatabaseFilter,
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
  templateUrl: './team-finder.html',
  styleUrl: './team-finder.css',
})
export class TeamFinder {
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly dialog = inject(MatDialog);
  private readonly columnPreferences = inject(FinderColumnPreferences);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private requestSequence = 0;
  private debounceId?: ReturnType<typeof setTimeout>;
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal(this.initialRequest());
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
    this.columnPreferences.load('teams'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.request().databaseIds),
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
  protected readonly labels = signal<Record<'league' | 'country', Record<string, FilterDisplay>>>({
    league: {},
    country: {},
  });
  protected readonly selectedLeagues = computed(() =>
    this.request().leagueKeys.map(
      (key): FilterDisplay => this.labels().league[key] ?? { key, label: key },
    ),
  );
  protected readonly selectedCountries = computed(() =>
    this.request().countryIds.map((id): FilterDisplay => {
      const key = String(id);
      return this.labels().country[key] ?? { key, label: key };
    }),
  );
  protected readonly rows = computed(() => this.result().rows.map(teamDisplay));
  protected readonly isNarrow = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly hasFilters = computed(() => {
    const request = this.request();
    return Boolean(
      request.text ||
      request.databaseIds.length ||
      request.versions.length ||
      request.leagueKeys.length ||
      request.countryIds.length ||
      request.playerEdition ||
      request.leagueEdition ||
      request.stadiumEdition ||
      Object.keys(request.overall).length ||
      Object.keys(request.attack).length ||
      Object.keys(request.midfield).length ||
      Object.keys(request.defence).length,
    );
  });

  constructor() {
    if (!isFinderSortVisible(this.columnDefinitions, this.columns(), this.request().sort))
      this.request.update((value) => ({ ...value, sort: 'name', direction: 'asc', offset: 0 }));
    effect(() => {
      const text = this.model().text;
      clearTimeout(this.debounceId);
      this.debounceId = setTimeout(() => {
        this.request.update((value) => ({ ...value, text, offset: 0 }));
        void this.search();
      }, 250);
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
    this.request.update((value) => ({ ...value, versions, offset: 0 }));
    void this.search();
  }

  protected setDatabases(databaseIds: string[]): void {
    const availableVersions = databaseVersions(this.databases(), databaseIds);
    this.request.update((value) => ({
      ...value,
      databaseIds,
      versions: value.versions.filter((version) => availableVersions.includes(version)),
      playerEdition: undefined,
      leagueEdition: undefined,
      stadiumEdition: undefined,
      offset: 0,
    }));
    this.contextPlayer.set(undefined);
    this.contextLeague.set(undefined);
    this.contextStadium.set(undefined);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
  }

  protected setRange(
    kind: 'overall' | 'attack' | 'midfield' | 'defence',
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

  protected async suggest(facet: TeamFacet, event: Event): Promise<void> {
    const text = (event.target as HTMLInputElement).value;
    const options = await this.qdb.suggestEntityFacets({
      databaseIds: this.request().databaseIds,
      entity: 'team',
      facet,
      text,
      versions: this.request().versions,
      limit: 20,
    });
    this.suggestions.update((value) => ({ ...value, [facet]: options }));
  }

  protected addFacet(facet: TeamFacet, option: EntityFacetOption, input: HTMLInputElement): void {
    if (facet === 'league')
      this.request.update((value) => ({
        ...value,
        leagueKeys: [...new Set([...value.leagueKeys, option.key])],
        offset: 0,
      }));
    else if (option.id !== undefined) {
      const id = option.id;
      this.request.update((value) => ({
        ...value,
        countryIds: [...new Set([...value.countryIds, id])],
        offset: 0,
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
    void this.search();
  }

  protected removeFacet(facet: TeamFacet, key: string): void {
    if (facet === 'league')
      this.request.update((value) => ({
        ...value,
        leagueKeys: value.leagueKeys.filter((item) => item !== key),
        offset: 0,
      }));
    else
      this.request.update((value) => ({
        ...value,
        countryIds: value.countryIds.filter((item) => item !== Number(key)),
        offset: 0,
      }));
    void this.search();
  }

  protected clearFilters(): void {
    this.model.set({ text: '' });
    this.request.set(defaultTeamSearchRequest());
    this.labels.set({ league: {}, country: {} });
    this.contextPlayer.set(undefined);
    this.contextLeague.set(undefined);
    this.contextStadium.set(undefined);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
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

  protected openColumns(): void {
    this.dialog
      .open<FinderColumnDrawer, FinderColumnDrawerData, FinderColumnKey[]>(FinderColumnDrawer, {
        ariaLabelledBy: 'finder-column-title',
        ariaModal: true,
        autoFocus: 'first-tabbable',
        data: {
          finder: 'teams',
          columns: this.columnDefinitions,
          defaultColumns: defaultFinderColumns('teams'),
          visibleColumns: this.columns(),
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
      })
      .afterClosed()
      .subscribe((columns) => {
        if (columns) this.applyColumns(columns);
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

  private applyColumns(columns: readonly FinderColumnKey[]): void {
    this.columnPreferences.save('teams', columns);
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

  private initialRequest(): TeamSearchRequest {
    const request = defaultTeamSearchRequest();
    const databaseId = this.route.snapshot.queryParamMap.get('databaseId') ?? 'built-in';
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const playerId = validId(this.route.snapshot.queryParamMap.get('playerId'));
    const leagueId = validId(this.route.snapshot.queryParamMap.get('leagueId'));
    const stadiumId = validId(this.route.snapshot.queryParamMap.get('stadiumId'));
    const contextCount = [playerId, leagueId, stadiumId].filter(
      (value) => value !== undefined,
    ).length;
    if (!version || contextCount !== 1) return request;
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
    return request;
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
