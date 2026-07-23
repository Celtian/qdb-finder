import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import type { DatabaseDescriptor } from '../qdb-contracts';
import { DatabaseFilter } from './database-filter';

const database = (id: string, name: string, kind: 'built-in' | 'custom'): DatabaseDescriptor => ({
  id,
  name,
  kind,
  schemaVersion: 3,
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

describe('DatabaseFilter', () => {
  let fixture: ComponentFixture<DatabaseFilter>;
  const databases = [
    database('built-in', 'Built-in FIFA 11–23', 'built-in'),
    database('custom-id', 'Custom database', 'custom'),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatabaseFilter] }).compileComponents();
    fixture = TestBed.createComponent(DatabaseFilter);
    fixture.componentRef.setInput('databases', databases);
    fixture.componentRef.setInput('selected', []);
    await fixture.whenStable();
  });

  it('shows an explicit All databases default and emits a selected subset', async () => {
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    const emitted: string[][] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => emitted.push(value));

    expect(await select.getValueText()).toBe('All databases');
    await select.open();
    expect(
      await Promise.all((await select.getOptions()).map((option) => option.getText())),
    ).toEqual(['All databases', 'Built-in FIFA 11–23', 'Custom database']);
    await select.clickOptions({ text: 'Custom database' });

    expect(emitted.at(-1)).toEqual(['custom-id']);
  });

  it('labels a single selected database and returns to all', async () => {
    fixture.componentRef.setInput('selected', ['custom-id']);
    await fixture.whenStable();
    const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    const emitted: string[][] = [];
    fixture.componentInstance.selectedChange.subscribe((value) => emitted.push(value));

    expect(await select.getValueText()).toBe('Custom database');
    await select.open();
    await select.clickOptions({ text: 'All databases' });

    expect(emitted.at(-1)).toEqual([]);
  });
});
