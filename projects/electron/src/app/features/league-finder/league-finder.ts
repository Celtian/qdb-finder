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
import { Qdb } from '../../core/qdb';
import {
  defaultLeagueSearchRequest,
  type EntityFacetOption,
  type LeagueEditionRow,
  type LeagueResultPage,
  type LeagueSortField,
  type RefereeEditionRow,
} from '../../core/qdb-contracts';
import { LeagueDetail } from '../league-detail/league-detail';

interface CountryDisplay {
  key: string;
  label: string;
  countryCode?: string;
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
  selector: 'app-league-finder',
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
  templateUrl: './league-finder.html',
  styleUrl: './league-finder.css',
})
export class LeagueFinder {
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
  protected readonly contextReferee = signal<RefereeEditionRow | undefined>(undefined);
  protected readonly result = signal<LeagueResultPage>({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  });
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly columnDefinitions = finderColumns.leagues;
  protected readonly columns = signal<readonly FinderColumnKey[]>(
    this.columnPreferences.load('leagues'),
  );
  protected readonly hiddenColumnCount = computed(
    () => this.columnDefinitions.length - this.columns().length,
  );
  protected readonly databases = this.databaseContext.available;
  protected readonly versions = computed(() =>
    databaseVersions(this.databases(), this.request().databaseIds),
  );
  protected readonly levels = Array.from({ length: 7 }, (_, index) => index + 1);
  protected readonly countrySuggestions = signal<EntityFacetOption[]>([]);
  protected readonly countryLabels = signal<Record<string, CountryDisplay>>({});
  protected readonly selectedCountries = computed(() =>
    this.request().countryIds.map((id): CountryDisplay => {
      const key = String(id);
      return this.countryLabels()[key] ?? { key, label: key };
    }),
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
      request.countryIds.length ||
      request.levels.length ||
      request.refereeEdition,
    );
  });

  constructor() {
    if (!isFinderSortVisible(this.columnDefinitions, this.columns(), this.request().sort))
      this.request.update((value) => ({ ...value, sort: 'name', direction: 'asc', offset: 0 }));
    void this.loadContextReferee();
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
      refereeEdition: undefined,
      offset: 0,
    }));
    this.contextReferee.set(undefined);
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    void this.search();
  }

  protected setLevels(levels: number[]): void {
    this.request.update((value) => ({ ...value, levels, offset: 0 }));
    void this.search();
  }

  protected async suggestCountries(event: Event): Promise<void> {
    this.countrySuggestions.set(
      await this.qdb.suggestEntityFacets({
        databaseIds: this.request().databaseIds,
        entity: 'league',
        facet: 'country',
        text: (event.target as HTMLInputElement).value,
        versions: this.request().versions,
        limit: 30,
      }),
    );
  }

  protected addCountry(option: EntityFacetOption, input: HTMLInputElement): void {
    if (option.id === undefined) return;
    const id = option.id;
    this.request.update((value) => ({
      ...value,
      countryIds: [...new Set([...value.countryIds, id])],
      offset: 0,
    }));
    this.countryLabels.update((value) => ({
      ...value,
      [option.key]: {
        key: option.key,
        label: option.label,
        countryCode: option.countryCode,
      },
    }));
    input.value = '';
    void this.search();
  }

  protected removeCountry(key: string): void {
    this.request.update((value) => ({
      ...value,
      countryIds: value.countryIds.filter((id) => id !== Number(key)),
      offset: 0,
    }));
    void this.search();
  }

  protected clearFilters(): void {
    this.model.set({ text: '' });
    this.request.set(defaultLeagueSearchRequest());
    this.countryLabels.set({});
    this.contextReferee.set(undefined);
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
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
      sort: event.active as LeagueSortField,
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
          finder: 'leagues',
          columns: this.columnDefinitions,
          defaultColumns: defaultFinderColumns('leagues'),
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

  protected async openLeague(row: LeagueEditionRow): Promise<void> {
    const league = await this.qdb.getLeague(row);
    this.dialog.open(LeagueDetail, {
      data: league,
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: 'dialog',
    });
  }

  private applyColumns(columns: readonly FinderColumnKey[]): void {
    this.columnPreferences.save('leagues', columns);
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

  private async search(): Promise<void> {
    const sequence = ++this.requestSequence;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.qdb.searchLeagues(this.request());
      if (sequence === this.requestSequence) this.result.set(result);
    } catch (error) {
      if (sequence === this.requestSequence)
        this.error.set(error instanceof Error ? error.message : 'League search failed.');
    } finally {
      if (sequence === this.requestSequence) this.loading.set(false);
    }
  }

  private initialRequest() {
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const refereeId = validId(this.route.snapshot.queryParamMap.get('refereeId'));
    const databaseId = this.route.snapshot.queryParamMap.get('databaseId') ?? 'built-in';
    return version !== undefined && refereeId !== undefined
      ? {
          ...defaultLeagueSearchRequest(),
          databaseIds: [databaseId],
          versions: [version],
          refereeEdition: { databaseId, version, refereeId },
        }
      : defaultLeagueSearchRequest();
  }

  private async loadContextReferee(): Promise<void> {
    const edition = this.request().refereeEdition;
    if (!edition) return;
    try {
      const referee = await this.qdb.getReferee(edition);
      if (referee) this.contextReferee.set(referee);
      else this.request.update((value) => ({ ...value, refereeEdition: undefined }));
    } catch {
      this.request.update((value) => ({ ...value, refereeEdition: undefined }));
    }
  }
}
