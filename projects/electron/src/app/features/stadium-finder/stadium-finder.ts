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
  templateUrl: './stadium-finder.html',
  styleUrl: './stadium-finder.css',
})
export class StadiumFinder {
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly dialog = inject(MatDialog);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private requestSequence = 0;
  private debounceId?: ReturnType<typeof setTimeout>;
  protected readonly model = signal({ text: '' });
  protected readonly searchForm = form(this.model);
  protected readonly request = signal(this.initialRequest());
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
  protected readonly columns = [
    'name',
    'originalId',
    'version',
    'country',
    'teams',
    'capacity',
    'built',
    'pitch',
    'licensed',
  ];
  protected readonly versions = computed(() =>
    [
      ...(this.databaseContext.info()?.versions ??
        Array.from({ length: 13 }, (_, index) => 23 - index)),
    ].sort((left, right) => right - left),
  );
  protected readonly availability = signal<AvailabilityFilter>('all');
  protected readonly suggestions = signal<Record<StadiumFacet, EntityFacetOption[]>>({
    country: [],
    team: [],
  });
  protected readonly labels = signal<Record<StadiumFacet, Record<string, FilterDisplay>>>({
    country: {},
    team: {},
  });
  protected readonly selectedCountries = computed(() =>
    this.request().countryIds.map((id): FilterDisplay => {
      const key = String(id);
      return this.labels().country[key] ?? { key, label: key };
    }),
  );
  protected readonly selectedTeams = computed(() =>
    this.request().teamKeys.map(
      (key): FilterDisplay => this.labels().team[key] ?? { key, label: key },
    ),
  );
  protected readonly isNarrow = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly hasFilters = computed(() => {
    const request = this.request();
    return Boolean(
      request.text ||
      request.versions.length ||
      request.countryIds.length ||
      request.teamKeys.length ||
      request.teamEdition ||
      request.isLicensed !== undefined ||
      Object.keys(request.capacity).length,
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
    effect(() => {
      if (!this.databaseContext.revision()) return;
      untracked(() => void this.search());
    });
    const context = this.request().teamEdition;
    if (context) void this.loadContextTeam(context);
  }

  protected setVersions(versions: number[]): void {
    this.request.update((value) => ({ ...value, versions, offset: 0 }));
    void this.search();
  }

  protected setCapacity(boundary: 'min' | 'max', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.request.update((value) => ({
      ...value,
      capacity: { ...value.capacity, [boundary]: raw === '' ? undefined : Number(raw) },
      offset: 0,
    }));
    void this.search();
  }

  protected setAvailability(value: AvailabilityFilter): void {
    this.availability.set(value);
    this.request.update((request) => ({
      ...request,
      isLicensed: value === 'all' ? undefined : value === 'licensed',
      offset: 0,
    }));
    void this.search();
  }

  protected async suggest(facet: StadiumFacet, event: Event): Promise<void> {
    const options = await this.qdb.suggestEntityFacets({
      entity: 'stadium',
      facet,
      text: (event.target as HTMLInputElement).value,
      versions: this.request().versions,
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
      this.request.update((value) => ({
        ...value,
        teamKeys: [...new Set([...value.teamKeys, option.key])],
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
        [option.key]: { key: option.key, label: option.label, countryCode: option.countryCode },
      },
    }));
    input.value = '';
    void this.search();
  }

  protected removeFacet(facet: StadiumFacet, key: string): void {
    if (facet === 'team')
      this.request.update((value) => ({
        ...value,
        teamKeys: value.teamKeys.filter((item) => item !== key),
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
    this.request.set(defaultStadiumSearchRequest());
    this.labels.set({ country: {}, team: {} });
    this.availability.set('all');
    this.contextTeam.set(undefined);
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
      sort: event.active as StadiumSortField,
      direction,
      offset: 0,
    }));
    void this.search();
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

  private initialRequest(): StadiumSearchRequest {
    const request = defaultStadiumSearchRequest();
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const teamId = validId(this.route.snapshot.queryParamMap.get('teamId'));
    return version && teamId
      ? { ...request, versions: [version], teamEdition: { version, teamId } }
      : request;
  }
  private async loadContextTeam(key: { version: number; teamId: number }): Promise<void> {
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
