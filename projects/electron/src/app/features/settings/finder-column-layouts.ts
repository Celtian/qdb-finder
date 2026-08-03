import {
  CdkDrag,
  type CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import {
  type FinderColumnDefinition,
  type FinderColumnPreference,
  type FinderKind,
  defaultFinderColumnPreference,
  finderColumns,
  toFinderColumnVisibility,
} from '../../core/finder-columns';
import { FinderPreferences } from '../../core/finder-preferences';

interface FinderLayoutTab {
  finder: FinderKind;
  label: string;
  singularLabel: string;
}

type FinderLayoutMap = Record<FinderKind, FinderColumnPreference>;
type OrderedFinderColumnMap = Record<FinderKind, readonly FinderColumnDefinition[]>;

const layoutTabs: readonly FinderLayoutTab[] = [
  { finder: 'leagues', label: 'Leagues', singularLabel: 'league' },
  { finder: 'teams', label: 'Teams', singularLabel: 'team' },
  { finder: 'players', label: 'Players', singularLabel: 'player' },
  { finder: 'referees', label: 'Referees', singularLabel: 'referee' },
  { finder: 'stadiums', label: 'Stadiums', singularLabel: 'stadium' },
];

const orderDefinitions = (
  finder: FinderKind,
  preference: FinderColumnPreference,
): readonly FinderColumnDefinition[] => {
  const definitions = new Map(finderColumns[finder].map((column) => [column.key, column]));
  return preference.order.flatMap((key) => {
    const definition = definitions.get(key);
    return definition ? [definition] : [];
  });
};

@Component({
  selector: 'app-finder-column-layouts',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
    CdkDropList,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './finder-column-layouts.html',
  styleUrl: './finder-column-layouts.css',
})
export class FinderColumnLayouts {
  private readonly preferences = inject(FinderPreferences);
  private readonly snackBar = inject(MatSnackBar);
  private readonly layouts = signal(this.loadLayouts());

  protected readonly tabs = layoutTabs;
  protected readonly announcement = signal('');
  protected readonly visibleColumns = computed(() => {
    const layouts = this.layouts();
    return {
      players: toFinderColumnVisibility(layouts.players.visible),
      teams: toFinderColumnVisibility(layouts.teams.visible),
      leagues: toFinderColumnVisibility(layouts.leagues.visible),
      referees: toFinderColumnVisibility(layouts.referees.visible),
      stadiums: toFinderColumnVisibility(layouts.stadiums.visible),
    };
  });
  protected readonly orderedColumns = computed<OrderedFinderColumnMap>(() => {
    const layouts = this.layouts();
    return {
      players: orderDefinitions('players', layouts.players),
      teams: orderDefinitions('teams', layouts.teams),
      leagues: orderDefinitions('leagues', layouts.leagues),
      referees: orderDefinitions('referees', layouts.referees),
      stadiums: orderDefinitions('stadiums', layouts.stadiums),
    };
  });

  protected setColumnVisibility(
    finder: FinderKind,
    column: FinderColumnDefinition,
    visible: boolean,
  ): void {
    if (column.required) return;
    const preference = this.layouts()[finder];
    const selected = new Set(preference.visible);
    if (visible) selected.add(column.key);
    else selected.delete(column.key);
    this.saveLayout(finder, {
      version: 2,
      order: preference.order,
      visible: preference.order.filter((key) => selected.has(key)),
    });
    this.announcement.set(`${column.label} ${visible ? 'shown' : 'hidden'} and saved.`);
  }

  protected drop(finder: FinderKind, event: CdkDragDrop<readonly FinderColumnDefinition[]>): void {
    this.reorder(finder, event.previousIndex, event.currentIndex);
  }

  protected moveColumn(finder: FinderKind, column: FinderColumnDefinition, offset: -1 | 1): void {
    const preference = this.layouts()[finder];
    const previousIndex = preference.order.indexOf(column.key);
    const currentIndex = previousIndex + offset;
    if (currentIndex < 0 || currentIndex >= preference.order.length) {
      this.announcement.set(
        `${column.label} is already the ${offset < 0 ? 'first' : 'last'} column.`,
      );
      return;
    }
    this.reorder(finder, previousIndex, currentIndex);
  }

  protected reset(finder: FinderKind, label: string): void {
    if (!this.preferences.resetColumns(finder)) {
      this.snackBar.open(`${label} column layout could not be reset.`, 'Dismiss', {
        duration: 6000,
      });
      return;
    }
    this.layouts.update((layouts) => ({
      ...layouts,
      [finder]: defaultFinderColumnPreference(finder),
    }));
    this.snackBar.open(`${label} column layout reset.`, 'Dismiss', { duration: 3000 });
  }

  protected resetAll(): void {
    if (!this.preferences.resetAllColumns()) {
      this.snackBar.open('Finder column layouts could not be reset.', 'Dismiss', {
        duration: 6000,
      });
      return;
    }
    this.layouts.set(this.loadLayouts());
    this.snackBar.open('Finder column layouts reset.', 'Dismiss', { duration: 3000 });
  }

  private reorder(finder: FinderKind, previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const preference = this.layouts()[finder];
    const order = [...preference.order];
    moveItemInArray(order, previousIndex, currentIndex);
    const visible = new Set(preference.visible);
    this.saveLayout(finder, {
      version: 2,
      order,
      visible: order.filter((key) => visible.has(key)),
    });
    const column = finderColumns[finder].find(({ key }) => key === order[currentIndex]);
    if (column) {
      this.announcement.set(
        `${column.label} moved to position ${currentIndex + 1} of ${order.length} and saved.`,
      );
    }
  }

  private saveLayout(finder: FinderKind, preference: FinderColumnPreference): void {
    this.layouts.update((layouts) => ({ ...layouts, [finder]: preference }));
    this.preferences.saveColumnPreference(finder, preference);
  }

  private loadLayouts(): FinderLayoutMap {
    return {
      players: this.preferences.loadColumnPreference('players'),
      teams: this.preferences.loadColumnPreference('teams'),
      leagues: this.preferences.loadColumnPreference('leagues'),
      referees: this.preferences.loadColumnPreference('referees'),
      stadiums: this.preferences.loadColumnPreference('stadiums'),
    };
  }
}
