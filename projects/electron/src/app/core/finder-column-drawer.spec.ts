import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import axe from 'axe-core';
import { FinderColumnDrawer, type FinderColumnDrawerData } from './finder-column-drawer';
import { defaultFinderColumns, finderColumns, type FinderColumnKey } from './finder-columns';

describe('FinderColumnDrawer', () => {
  let fixture: ComponentFixture<FinderColumnDrawer>;
  const close = vi.fn<(columns?: FinderColumnKey[]) => void>();
  const data: FinderColumnDrawerData = {
    finder: 'players',
    columns: finderColumns.players,
    defaultColumns: defaultFinderColumns('players'),
    visibleColumns: ['name', 'database'],
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

  it('stages changes, resets defaults, applies canonical columns, and cancels', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const birthDate = await loader.getHarness(MatCheckboxHarness.with({ label: 'Birth date' }));
    await birthDate.check();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    expect(close).toHaveBeenLastCalledWith(['name', 'database', 'birthDate']);

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Reset to defaults' }))).click();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }))).click();
    await fixture.whenStable();
    expect(close).toHaveBeenLastCalledWith(defaultFinderColumns('players'));

    close.mockClear();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }))).click();
    expect(close).toHaveBeenLastCalledWith();
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
