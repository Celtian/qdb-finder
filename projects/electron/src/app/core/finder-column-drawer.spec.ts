import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DebugElement, getDebugNode } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import axe from 'axe-core';
import { FinderColumnDrawer, type FinderColumnDrawerData } from './finder-column-drawer';
import {
  defaultFinderColumnPreference,
  finderColumns,
  type FinderColumnPreference,
} from './finder-columns';

describe('FinderColumnDrawer', () => {
  let fixture: ComponentFixture<FinderColumnDrawer>;
  const close = vi.fn<(preference?: FinderColumnPreference) => void>();
  const data: FinderColumnDrawerData = {
    finder: 'players',
    columns: finderColumns.players,
    preference: {
      ...defaultFinderColumnPreference('players'),
      visible: ['name', 'database'],
    },
  };

  beforeEach(async () => {
    close.mockClear();
    await TestBed.configureTestingModule({
      imports: [FinderColumnDrawer],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FinderColumnDrawer);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('labels the form and keeps Name selected and disabled', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const name = await loader.getHarness(MatCheckboxHarness.with({ label: 'Player' }));
    const database = await loader.getHarness(MatCheckboxHarness.with({ label: 'Database' }));
    const birthDate = await loader.getHarness(MatCheckboxHarness.with({ label: 'Birth date' }));

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('form')?.getAttribute('aria-labelledby'),
    ).toBe('finder-column-title');
    expect(await name.isChecked()).toBe(true);
    expect(await name.isDisabled()).toBe(true);
    expect(await database.isChecked()).toBe(true);
    expect(await birthDate.isChecked()).toBe(false);
  });

  it('stages visibility and keyboard order changes, resets defaults, applies, and cancels', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const birthDate = await loader.getHarness(MatCheckboxHarness.with({ label: 'Birth date' }));
    await birthDate.check();
    const databaseHandle = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label="Reorder Database column"]' }),
    );
    await (await databaseHandle.host()).sendKeys(TestKey.UP_ARROW, TestKey.UP_ARROW);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    expect(close).toHaveBeenLastCalledWith({
      version: 2,
      order: [
        'database',
        'name',
        'originalId',
        'version',
        'nationality',
        'teams',
        'positions',
        'birthDate',
        'contractValidUntil',
        'age',
        'height',
        'weight',
        'preferredFoot',
        'overall',
        'potential',
        'bestRating',
      ],
      visible: ['database', 'name', 'birthDate'],
    });

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Reset to defaults' }))).click();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    expect(close).toHaveBeenLastCalledWith(defaultFinderColumnPreference('players'));

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();
    expect(close).toHaveBeenLastCalledWith();
  });

  it('reorders hidden columns by pointer drop and retains their position when enabled', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const dropList = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.column-list',
    );
    if (!dropList) throw new Error('Column drop list was not created.');
    const debugElement = getDebugNode(dropList) as DebugElement | null;
    if (!debugElement) throw new Error('Column drop list debug element was not created.');

    debugElement.triggerEventHandler('cdkDropListDropped', {
      previousIndex: 1,
      currentIndex: 4,
    });
    await fixture.whenStable();
    await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Original ID' }))).check();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();

    expect(close).toHaveBeenLastCalledWith(
      expect.objectContaining({
        order: [
          'name',
          'database',
          'version',
          'nationality',
          'originalId',
          'teams',
          'positions',
          'birthDate',
          'contractValidUntil',
          'age',
          'height',
          'weight',
          'preferredFoot',
          'overall',
          'potential',
          'bestRating',
        ],
        visible: ['name', 'database', 'originalId'],
      }),
    );
  });

  it('announces when a keyboard reorder reaches either list boundary', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const firstHandle = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label="Reorder Player column"]' }),
    );
    const lastHandle = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[aria-label="Reorder Best column"]' }),
    );

    await (await firstHandle.host()).sendKeys(TestKey.UP_ARROW);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Player is already the first column.',
    );

    await (await lastHandle.host()).sendKeys(TestKey.DOWN_ARROW);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Best is already the last column.',
    );
  });

  it('has no detectable AXE violations when opened as a side drawer', async () => {
    (fixture.nativeElement as HTMLElement).remove();
    TestBed.inject(MatDialog).open(FinderColumnDrawer, {
      ariaLabelledBy: 'finder-column-title',
      ariaModal: true,
      autoFocus: 'first-tabbable',
      data,
      height: '100vh',
      maxHeight: '100vh',
      maxWidth: '100vw',
      panelClass: 'finder-column-drawer-panel',
      position: { right: '0', top: '0' },
      restoreFocus: true,
      width: '28rem',
    });
    await fixture.whenStable();

    const overlay = document.querySelector<HTMLElement>('.cdk-overlay-container');
    if (!overlay) throw new Error('Column drawer overlay was not created.');
    const results = await axe.run(overlay);
    expect(results.violations).toEqual([]);
  });
});
