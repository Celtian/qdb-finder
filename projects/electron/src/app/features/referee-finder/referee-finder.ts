import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { Qdb } from '../../core/qdb';
import {
  defaultRefereeSearchRequest,
  type EntityFacetOption,
  type LeagueEditionRow,
  type RefereeEditionRow,
  type RefereeResultPage,
  type RefereeSearchRequest,
  type RefereeSortField,
} from '../../core/qdb-contracts';
import { RefereeDetail } from '../referee-detail/referee-detail';

type RefereeFacet = 'nationality' | 'league';
type AvailabilityFilter = 'all' | 'real' | 'generic';

interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

interface RefereeDisplay extends RefereeEditionRow {
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
  private readonly dialog = inject(MatDialog);
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
  protected readonly columns = [
    'name',
    'version',
    'nationality',
    'leagues',
    'age',
    'height',
    'real',
  ];
  protected readonly versions = Array.from({ length: 13 }, (_, index) => 23 - index);
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
    this.result().rows.map((row) => ({ ...row, leagueText: row.leagues.join(', ') })),
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
      request.nationalityIds.length ||
      request.leagueKeys.length ||
      request.leagueEdition ||
      request.isReal !== undefined ||
      Object.keys(request.age).length,
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
    const context = this.request().leagueEdition;
    if (context) void this.loadContextLeague(context);
  }

  protected setVersions(versions: number[]): void {
    this.request.update((value) => ({ ...value, versions, offset: 0 }));
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

  private initialRequest(): RefereeSearchRequest {
    const request = defaultRefereeSearchRequest();
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const leagueId = validId(this.route.snapshot.queryParamMap.get('leagueId'));
    return version && leagueId
      ? { ...request, versions: [version], leagueEdition: { version, leagueId } }
      : request;
  }

  private async loadContextLeague(key: { version: number; leagueId: number }): Promise<void> {
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
