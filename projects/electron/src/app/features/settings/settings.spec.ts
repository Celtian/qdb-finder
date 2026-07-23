import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { TestBed } from '@angular/core/testing';
import type { WritableSignal } from '@angular/core';
import axe from 'axe-core';
import { of } from 'rxjs';
import { DatabaseContext } from '../../core/database-context';
import {
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from '../../core/finder-preferences';
import { Qdb } from '../../core/qdb';
import type { DatabaseDescriptor } from '../../core/qdb-contracts';
import { themePreferenceKey } from '../../core/theme-preferences';
import { ConfirmCustomDatabaseRemoval, Settings } from './settings';

const database = (id: string, name: string, kind: 'built-in' | 'custom'): DatabaseDescriptor => ({
  id,
  name,
  kind,
  schemaVersion: 2,
  editions: 1,
  teamEditions: 1,
  leagueEditions: 1,
  refereeEditions: 1,
  stadiumEditions: 1,
  teamLinks: 1,
  sourceFiles: 1,
  versions: [23],
  generatedAt: '2026-07-21T00:00:00.000Z',
  sqliteVersion: '3.50.0',
  status: 'available',
});

describe('Settings', () => {
  const builtIn = database('built-in', 'Built-in FIFA 11–23', 'built-in');
  const custom = database('11111111-1111-4111-8111-111111111111', 'Custom FIFA 23', 'custom');
  let context: DatabaseContext;
  let databases: DatabaseDescriptor[];
  let dialogResult: unknown;
  const listDatabases = vi.fn(async () => databases);
  const removeCustomDatabases = vi.fn(async () => [custom.id]);
  const open = vi.fn(() => ({ afterClosed: () => of(dialogResult) }));

  beforeEach(async () => {
    window.localStorage.clear();
    databases = [builtIn, custom];
    dialogResult = false;
    listDatabases.mockClear();
    removeCustomDatabases.mockClear();
    open.mockClear();
    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        {
          provide: Qdb,
          useValue: {
            listDatabases: async () => {
              const result = await listDatabases();
              context.set(result);
              return result;
            },
            removeCustomDatabases: async () => {
              const ids = await removeCustomDatabases();
              context.set(
                databases.filter((item) => !ids.includes(item.id)),
                true,
              );
              return ids;
            },
          },
        },
        { provide: MatDialog, useValue: { open } },
      ],
    }).compileComponents();
    context = TestBed.inject(DatabaseContext);
  });

  it('loads custom database state and changes the persisted theme', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    expect(fixture.nativeElement.textContent).toContain('1 custom database installed');
    const dark = await loader.getHarness(MatRadioButtonHarness.with({ label: /Dark/ }));
    await dark.check();
    await fixture.whenStable();

    expect(window.localStorage.getItem(themePreferenceKey)).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('confirms and resets saved filters and columns without changing the theme', async () => {
    window.localStorage.setItem(finderFilterPreferenceKey('players'), '{}');
    window.localStorage.setItem(finderColumnPreferenceKey('players'), '["name"]');
    window.localStorage.setItem(themePreferenceKey, 'light');
    dialogResult = true;
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();

    const button = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatButtonHarness.with({ text: 'Reset filters and columns' }),
    );
    await button.click();
    await fixture.whenStable();

    expect(window.localStorage.getItem(finderFilterPreferenceKey('players'))).toBeNull();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('players'))).toBeNull();
    expect(window.localStorage.getItem(themePreferenceKey)).toBe('light');
    expect(fixture.nativeElement.textContent).toContain('were reset');
  });

  it('removes custom databases after confirmation and resets only saved filters', async () => {
    window.localStorage.setItem(finderFilterPreferenceKey('teams'), '{}');
    window.localStorage.setItem(finderColumnPreferenceKey('teams'), '["name"]');
    dialogResult = true;
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();

    const button = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatButtonHarness.with({ text: /Remove all custom databases/ }),
    );
    await button.click();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledWith(
      ConfirmCustomDatabaseRemoval,
      expect.objectContaining({ data: [custom] }),
    );
    expect(removeCustomDatabases).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(finderFilterPreferenceKey('teams'))).toBeNull();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('teams'))).not.toBeNull();
    expect(await button.isDisabled()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('1 custom database was removed');
  });

  it('leaves data unchanged when destructive confirmation is cancelled', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const button = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatButtonHarness.with({ text: /Remove all custom databases/ }),
    );

    await button.click();
    await fixture.whenStable();

    expect(removeCustomDatabases).not.toHaveBeenCalled();
    expect(context.databases()).toEqual([builtIn, custom]);
  });

  it('keeps finder preferences when their reset is cancelled', async () => {
    window.localStorage.setItem(finderFilterPreferenceKey('players'), '{}');
    window.localStorage.setItem(finderColumnPreferenceKey('players'), '["name"]');
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const testable = fixture.componentInstance as unknown as {
      resetFinderPreferences(): Promise<void>;
    };

    await testable.resetFinderPreferences();

    expect(window.localStorage.getItem(finderFilterPreferenceKey('players'))).not.toBeNull();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('players'))).not.toBeNull();
  });

  it('does not open removal confirmation without removable data or while already removing', async () => {
    databases = [builtIn];
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const testable = fixture.componentInstance as unknown as {
      removing: WritableSignal<boolean>;
      removeCustomDatabases(): Promise<void>;
    };

    await testable.removeCustomDatabases();
    expect(open).not.toHaveBeenCalled();

    context.set([builtIn, custom]);
    testable.removing.set(true);
    await testable.removeCustomDatabases();
    expect(open).not.toHaveBeenCalled();
  });

  it('reports plural removal success and removal failures', async () => {
    const secondCustom = database(
      '22222222-2222-4222-8222-222222222222',
      'Custom FIFA 22',
      'custom',
    );
    databases = [builtIn, custom, secondCustom];
    dialogResult = true;
    removeCustomDatabases.mockResolvedValueOnce([custom.id, secondCustom.id]);
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const testable = fixture.componentInstance as unknown as {
      error: WritableSignal<string>;
      success: WritableSignal<string>;
      removeCustomDatabases(): Promise<void>;
    };

    await testable.removeCustomDatabases();
    expect(testable.success()).toContain('2 custom databases were removed');

    context.set([builtIn, custom]);
    removeCustomDatabases.mockRejectedValueOnce(new Error('Removal crashed.'));
    await testable.removeCustomDatabases();
    expect(testable.error()).toBe('Removal crashed.');

    removeCustomDatabases.mockRejectedValueOnce('unexpected failure');
    await testable.removeCustomDatabases();
    expect(testable.error()).toBe('Custom databases could not be removed.');
  });

  it('reports database-loading errors and retries with a fallback message', async () => {
    listDatabases.mockRejectedValueOnce(new Error('Library crashed.'));
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();
    const testable = fixture.componentInstance as unknown as {
      error: WritableSignal<string>;
      retry(): void;
    };

    expect(testable.error()).toBe('Library crashed.');

    listDatabases.mockRejectedValueOnce('unexpected failure');
    testable.retry();
    await fixture.whenStable();
    expect(testable.error()).toBe('Database library is unavailable.');
  });

  it('has no detectable AXE violations', async () => {
    const fixture = TestBed.createComponent(Settings);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });
});
