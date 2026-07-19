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
import { scoreBadgeClass } from '../../core/attribute-value';
import { CountryFlag } from '../../core/country-flag/country-flag';
import { Qdb } from '../../core/qdb';
import {
  defaultTeamSearchRequest,
  type EntityFacetOption,
  type LeagueEditionRow,
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
  private readonly dialog = inject(MatDialog);
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
  protected readonly contextLeague = signal<LeagueEditionRow | undefined>(undefined);
  protected readonly contextStadium = signal<StadiumEditionRow | undefined>(undefined);
  protected readonly columns = [
    'name',
    'version',
    'country',
    'league',
    'squadSize',
    'overall',
    'attack',
    'midfield',
    'defence',
  ];
  protected readonly versions = Array.from({ length: 13 }, (_, index) => 23 - index);
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
      request.versions.length ||
      request.leagueKeys.length ||
      request.countryIds.length ||
      request.leagueEdition ||
      request.stadiumEdition ||
      Object.keys(request.overall).length ||
      Object.keys(request.attack).length ||
      Object.keys(request.midfield).length ||
      Object.keys(request.defence).length,
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
    const stadiumContext = this.request().stadiumEdition;
    if (stadiumContext) void this.loadContextStadium(stadiumContext);
  }

  protected setVersions(versions: number[]): void {
    this.request.update((value) => ({ ...value, versions, offset: 0 }));
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

  private initialRequest(): TeamSearchRequest {
    const request = defaultTeamSearchRequest();
    const version = validVersion(this.route.snapshot.queryParamMap.get('version'));
    const leagueId = validId(this.route.snapshot.queryParamMap.get('leagueId'));
    const stadiumId = validId(this.route.snapshot.queryParamMap.get('stadiumId'));
    if (!version || Boolean(leagueId) === Boolean(stadiumId)) return request;
    if (leagueId) return { ...request, versions: [version], leagueEdition: { version, leagueId } };
    if (stadiumId)
      return { ...request, versions: [version], stadiumEdition: { version, stadiumId } };
    return request;
  }

  private async loadContextLeague(key: { version: number; leagueId: number }): Promise<void> {
    try {
      this.contextLeague.set(await this.qdb.getLeague(key));
    } catch {
      this.request.update((value) => ({ ...value, leagueEdition: undefined }));
    }
  }

  private async loadContextStadium(key: { version: number; stadiumId: number }): Promise<void> {
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
