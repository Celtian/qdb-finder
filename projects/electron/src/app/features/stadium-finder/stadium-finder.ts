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
  defaultStadiumSearchRequest,
  type EntityFacetOption,
  type StadiumEditionRow,
  type StadiumResultPage,
  type StadiumSearchRequest,
  type StadiumSortField,
  type TeamEditionRow,
} from '../../core/qdb-contracts';
import { StadiumDetail } from '../stadium-detail/stadium-detail';

type StadiumFacet = 'country' | 'team';
type AvailabilityFilter = 'all' | 'licensed' | 'generic';

interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

interface StadiumDisplay extends StadiumEditionRow {
  pitch: string;
  licensed: string;
}

const stadiumDisplay = (row: StadiumEditionRow): StadiumDisplay => ({
  ...row,
  pitch:
    row.pitchLengthMeters === null || row.pitchWidthMeters === null
      ? '—'
      : `${row.pitchLengthMeters} × ${row.pitchWidthMeters} m`,
  licensed: row.isLicensed === null ? '—' : row.isLicensed ? 'Yes' : 'No',
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
  selector: 'app-stadium-finder',
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
  templateUrl: './stadium-finder.html',
  styleUrl: './stadium-finder.css',
})
export class StadiumFinder {
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preferences = inject(FinderPreferences);
  private readonly routeRequest = this.initialContextRequest();
  private readonly savedFilters = this.routeRequest
    ? undefined
    : this.preferences.loadFilters('stadiums');
  private readonly initialRequestState = this.routeRequest ?? this.restoredRequest();
  private requestSequence = 0;
  private filterDialogRef?: MatDialogRef<unknown>;
  private readonly filterDrawer = viewChild.required<TemplateRef<unknown>>('filterDrawer');
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal<StadiumSearchRequest>(
    this.cloneRequest(this.initialRequestState),
  );
  protected readonly draftRequest = signal<StadiumSearchRequest>(
    this.cloneRequest(this.initialRequestState),
  );
  protected readonly result = signal<StadiumResultPage>({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  });
  protected readonly rows = computed(() => this.result().rows.map(stadiumDisplay));
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly contextTeam = signal<TeamEditionRow | undefined>(undefined);
  protected readonly columnDefinitions = finderColumns.stadiums;
  protected readonly columns = signal<readonly FinderColumnKey[]>(
    this.preferences.loadColumns('stadiums'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.draftRequest().databaseIds),
  );
  protected readonly availability = signal<AvailabilityFilter>(
    this.savedFilters?.isLicensed === undefined
      ? 'all'
      : this.savedFilters.isLicensed
        ? 'licensed'
        : 'generic',
  );
  protected readonly suggestions = signal<Record<StadiumFacet, EntityFacetOption[]>>({
    country: [],
    team: [],
  });
  protected readonly labels = signal<Record<StadiumFacet, Record<string, FilterDisplay>>>(
    structuredClone(this.savedFilters?.labels ?? { country: {}, team: {} }),
  );
  private appliedLabels: Record<StadiumFacet, Record<string, FilterDisplay>> = {
    country: { ...(this.savedFilters?.labels.country ?? {}) },
    team: { ...(this.savedFilters?.labels.team ?? {}) },
  };
  protected readonly selectedCountries = computed(() =>
    this.draftRequest().countryIds.map((id): FilterDisplay => {
      const key = String(id);
      return this.labels().country[key] ?? { key, label: key };
    }),
  );
  protected readonly selectedTeams = computed(() =>
    this.draftRequest().teamKeys.map(
      (key): FilterDisplay => this.labels().team[key] ?? { key, label: key },
    ),
  );
  protected readonly activeFilterCount = computed(() => this.filterCount(this.request()));
  protected readonly draftHasFilters = computed(() => this.filterCount(this.draftRequest()) > 0);
  protected readonly resultStatus = computed(() =>
    this.loading()
      ? 'Searching stadiums…'
      : `${this.result().total.toLocaleString()} stadium editions`,
  );

  private filterCount(request: StadiumSearchRequest): number {
    return [
      request.databaseIds.length > 0,
      request.versions.length > 0,
      request.countryIds.length > 0,
      request.teamKeys.length > 0,
      Boolean(request.teamEdition),
      request.isLicensed !== undefined,
      Object.keys(request.capacity).length > 0,
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
    const context = this.request().teamEdition;
    if (context) void this.loadContextTeam(context);
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
    }));
  }

  protected setCapacity(boundary: 'min' | 'max', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.draftRequest.update((value) => ({
      ...value,
      capacity: { ...value.capacity, [boundary]: raw === '' ? undefined : Number(raw) },
    }));
  }

  protected setAvailability(value: AvailabilityFilter): void {
    this.availability.set(value);
    this.draftRequest.update((request) => ({
      ...request,
      isLicensed: value === 'all' ? undefined : value === 'licensed',
    }));
  }

  protected async suggest(facet: StadiumFacet, event: Event): Promise<void> {
    const options = await this.qdb.suggestEntityFacets({
      databaseIds: this.draftRequest().databaseIds,
      entity: 'stadium',
      facet,
      text: (event.target as HTMLInputElement).value,
      versions: this.draftRequest().versions,
      limit: 20,
    });
    this.suggestions.update((value) => ({ ...value, [facet]: options }));
  }

  protected addFacet(
    facet: StadiumFacet,
    option: EntityFacetOption,
    input: HTMLInputElement,
  ): void {
    if (facet === 'team')
      this.draftRequest.update((value) => ({
        ...value,
        teamKeys: [...new Set([...value.teamKeys, option.key])],
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
        [option.key]: { key: option.key, label: option.label, countryCode: option.countryCode },
      },
    }));
    input.value = '';
  }

  protected removeFacet(facet: StadiumFacet, key: string): void {
    if (facet === 'team')
      this.draftRequest.update((value) => ({
        ...value,
        teamKeys: value.teamKeys.filter((item) => item !== key),
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
      ...defaultStadiumSearchRequest(),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
    });
    this.labels.set({ country: {}, team: {} });
    this.appliedLabels = { country: {}, team: {} };
    this.availability.set('all');
    this.contextTeam.set(undefined);
    this.preferences.clearFilters('stadiums');
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    void this.search();
  }

  protected clearDraftFilters(): void {
    const current = this.draftRequest();
    this.draftRequest.set({
      ...defaultStadiumSearchRequest(),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
    });
    this.labels.set({ country: {}, team: {} });
    this.availability.set('all');
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
    if (!event.direction) return;
    const direction = event.direction;
    this.request.update((value) => ({
      ...value,
      sort: event.active as StadiumSortField,
      direction,
      offset: 0,
    }));
    void this.search();
  }
  protected openFilters(): void {
    this.draftRequest.set(this.cloneRequest(this.request()));
    this.labels.set({
      country: { ...this.appliedLabels.country },
      team: { ...this.appliedLabels.team },
    });
    this.availability.set(
      this.request().isLicensed === undefined
        ? 'all'
        : this.request().isLicensed
          ? 'licensed'
          : 'generic',
    );
    this.filterDialogRef = this.dialog.open(
      this.filterDrawer(),
      finderFilterDialogConfig('stadium-filter-title'),
    );
  }
  protected applyFilters(): void {
    const current = this.request();
    const draft = this.draftRequest();
    const databaseChanged = current.databaseIds.join('\u0000') !== draft.databaseIds.join('\u0000');
    const contextCleared = Boolean(current.teamEdition && !draft.teamEdition);
    this.request.set({
      ...this.cloneRequest(draft),
      text: current.text,
      sort: current.sort,
      direction: current.direction,
      pageSize: current.pageSize,
      offset: 0,
    });
    this.appliedLabels = {
      country: { ...this.labels().country },
      team: { ...this.labels().team },
    };
    this.persistFilters();
    if (databaseChanged || contextCleared) {
      this.contextTeam.set(undefined);
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
            finder: 'stadiums',
            columns: this.columnDefinitions,
            preference: this.preferences.loadColumnPreference('stadiums'),
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
  protected async openStadium(row: StadiumEditionRow): Promise<void> {
    const stadium = await this.qdb.getStadium(row);
    this.dialog.open(StadiumDetail, {
      data: stadium,
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
    });
  }

  private applyColumns(preference: FinderColumnPreference): void {
    const columns = visibleFinderColumns(preference);
    this.preferences.saveColumnPreference('stadiums', preference);
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

  private cloneRequest(value: StadiumSearchRequest): StadiumSearchRequest {
    return {
      ...value,
      databaseIds: [...value.databaseIds],
      versions: [...value.versions],
      countryIds: [...value.countryIds],
      teamKeys: [...value.teamKeys],
      capacity: { ...value.capacity },
    };
  }

  private initialContextRequest(): StadiumSearchRequest | undefined {
    const request = defaultStadiumSearchRequest();
    const databaseId = this.route.snapshot.queryParamMap.get('databaseId') ?? 'built-in';
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const teamId = validId(this.route.snapshot.queryParamMap.get('teamId'));
    return version && teamId
      ? {
          ...request,
          databaseIds: [databaseId],
          versions: [version],
          teamEdition: { databaseId, version, teamId },
        }
      : undefined;
  }

  private restoredRequest(): StadiumSearchRequest {
    const filters = this.savedFilters;
    if (!filters) return defaultStadiumSearchRequest();
    return {
      ...defaultStadiumSearchRequest(),
      databaseIds: [...filters.databaseIds],
      versions: [...filters.versions],
      countryIds: [...filters.countryIds],
      teamKeys: [...filters.teamKeys],
      capacity: { ...filters.capacity },
      isLicensed: filters.isLicensed,
    };
  }

  private persistFilters(): void {
    const request = this.request();
    this.preferences.saveFilters('stadiums', {
      databaseIds: [...request.databaseIds],
      versions: [...request.versions],
      countryIds: [...request.countryIds],
      teamKeys: [...request.teamKeys],
      capacity: { ...request.capacity },
      isLicensed: request.isLicensed,
      labels: structuredClone(this.appliedLabels),
    });
  }
  private async loadContextTeam(
    key: NonNullable<StadiumSearchRequest['teamEdition']>,
  ): Promise<void> {
    try {
      this.contextTeam.set(await this.qdb.getTeam(key));
    } catch {
      this.request.update((value) => ({ ...value, teamEdition: undefined }));
    }
  }
  private async search(): Promise<void> {
    const sequence = ++this.requestSequence;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.qdb.searchStadiums(this.request());
      if (sequence === this.requestSequence) this.result.set(result);
    } catch (error) {
      if (sequence === this.requestSequence)
        this.error.set(error instanceof Error ? error.message : 'Stadium search failed.');
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }
}
