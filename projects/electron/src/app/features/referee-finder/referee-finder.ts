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
import { formatDateOnly } from '../../core/player-profile-value';
import { Qdb } from '../../core/qdb';
import {
  defaultRefereeSearchRequest,
  type EntityFacetOption,
  type Gender,
  type LeagueEditionRow,
  type RefereeEditionRow,
  type RefereeResultPage,
  type RefereeSearchRequest,
  type RefereeSortField,
} from '../../core/qdb-contracts';
import { RefereeDetail } from '../referee-detail/referee-detail';

type RefereeFacet = 'nationality' | 'league';
type AvailabilityFilter = 'all' | 'real' | 'generic';
type GenderFilter = 'all' | Gender;

interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

interface RefereeDisplay extends RefereeEditionRow {
  birthDateLabel: string;
  leagueText: string;
}

const validVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};
const validId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

@Component({
  selector: 'app-referee-finder',
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
  templateUrl: './referee-finder.html',
  styleUrl: './referee-finder.css',
})
export class RefereeFinder {
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
  protected readonly result = signal<RefereeResultPage>({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  });
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly contextLeague = signal<LeagueEditionRow | undefined>(undefined);
  protected readonly columnDefinitions = finderColumns.referees;
  protected readonly columns = signal<readonly FinderColumnKey[]>(
    this.columnPreferences.load('referees'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.request().databaseIds),
  );
  protected readonly availability = signal<AvailabilityFilter>('all');
  protected readonly suggestions = signal<Record<RefereeFacet, EntityFacetOption[]>>({
    nationality: [],
    league: [],
  });
  protected readonly labels = signal<Record<RefereeFacet, Record<string, FilterDisplay>>>({
    nationality: {},
    league: {},
  });
  protected readonly selectedNationalities = computed(() =>
    this.request().nationalityIds.map((id): FilterDisplay => {
      const key = String(id);
      return this.labels().nationality[key] ?? { key, label: key };
    }),
  );
  protected readonly selectedLeagues = computed(() =>
    this.request().leagueKeys.map(
      (key): FilterDisplay => this.labels().league[key] ?? { key, label: key },
    ),
  );
  protected readonly rows = computed<RefereeDisplay[]>(() =>
    this.result().rows.map((row) => ({
      ...row,
      birthDateLabel: formatDateOnly(row.birthDate),
      leagueText: row.leagues.join(', '),
    })),
  );
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
      request.gender !== undefined ||
      request.nationalityIds.length ||
      request.leagueKeys.length ||
      request.leagueEdition ||
      request.isReal !== undefined ||
      Object.keys(request.age).length,
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
    const context = this.request().leagueEdition;
    if (context) void this.loadContextLeague(context);
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
      leagueEdition: undefined,
      offset: 0,
    }));
    this.contextLeague.set(undefined);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
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

  protected setAge(boundary: 'min' | 'max', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.request.update((value) => ({
      ...value,
      age: { ...value.age, [boundary]: raw === '' ? undefined : Number(raw) },
      offset: 0,
    }));
    void this.search();
  }

  protected setAvailability(value: AvailabilityFilter): void {
    this.availability.set(value);
    this.request.update((request) => ({
      ...request,
      isReal: value === 'all' ? undefined : value === 'real',
      offset: 0,
    }));
    void this.search();
  }

  protected async suggest(facet: RefereeFacet, event: Event): Promise<void> {
    const options = await this.qdb.suggestEntityFacets({
      databaseIds: this.request().databaseIds,
      entity: 'referee',
      facet,
      text: (event.target as HTMLInputElement).value,
      versions: this.request().versions,
      limit: 20,
    });
    this.suggestions.update((value) => ({ ...value, [facet]: options }));
  }

  protected addFacet(
    facet: RefereeFacet,
    option: EntityFacetOption,
    input: HTMLInputElement,
  ): void {
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
        nationalityIds: [...new Set([...value.nationalityIds, id])],
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

  protected removeFacet(facet: RefereeFacet, key: string): void {
    if (facet === 'league')
      this.request.update((value) => ({
        ...value,
        leagueKeys: value.leagueKeys.filter((item) => item !== key),
        offset: 0,
      }));
    else
      this.request.update((value) => ({
        ...value,
        nationalityIds: value.nationalityIds.filter((item) => item !== Number(key)),
        offset: 0,
      }));
    void this.search();
  }

  protected clearFilters(): void {
    this.model.set({ text: '' });
    this.request.set(defaultRefereeSearchRequest());
    this.labels.set({ nationality: {}, league: {} });
    this.availability.set('all');
    this.contextLeague.set(undefined);
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
    if (!event.direction) return;
    const direction = event.direction;
    this.request.update((value) => ({
      ...value,
      sort: event.active as RefereeSortField,
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
          finder: 'referees',
          columns: this.columnDefinitions,
          defaultColumns: defaultFinderColumns('referees'),
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

  protected async openReferee(row: RefereeEditionRow): Promise<void> {
    const referee = await this.qdb.getReferee(row);
    this.dialog.open(RefereeDetail, {
      data: referee,
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
    });
  }

  private applyColumns(columns: readonly FinderColumnKey[]): void {
    this.columnPreferences.save('referees', columns);
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

  private initialRequest(): RefereeSearchRequest {
    const request = defaultRefereeSearchRequest();
    const databaseId = this.route.snapshot.queryParamMap.get('databaseId') ?? 'built-in';
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const leagueId = validId(this.route.snapshot.queryParamMap.get('leagueId'));
    return version && leagueId
      ? {
          ...request,
          databaseIds: [databaseId],
          versions: [version],
          leagueEdition: { databaseId, version, leagueId },
        }
      : request;
  }

  private async loadContextLeague(
    key: NonNullable<RefereeSearchRequest['leagueEdition']>,
  ): Promise<void> {
    try {
      this.contextLeague.set(await this.qdb.getLeague(key));
    } catch {
      this.request.update((value) => ({ ...value, leagueEdition: undefined }));
    }
  }

  private async search(): Promise<void> {
    const sequence = ++this.requestSequence;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.qdb.searchReferees(this.request());
      if (sequence === this.requestSequence) this.result.set(result);
    } catch (error) {
      if (sequence === this.requestSequence)
        this.error.set(error instanceof Error ? error.message : 'Referee search failed.');
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }
}
