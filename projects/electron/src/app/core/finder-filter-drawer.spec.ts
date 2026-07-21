import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import axe from 'axe-core';
import { finderFilterDialogConfig } from './finder-filter-dialog';
import { FinderFilterDrawer } from './finder-filter-drawer';

describe('FinderFilterDrawer', () => {
  let fixture: ComponentFixture<FinderFilterDrawer>;
  const close = vi.fn();

  beforeEach(async () => {
    close.mockClear();
    await TestBed.configureTestingModule({
      imports: [FinderFilterDrawer],
      providers: [{ provide: MatDialogRef, useValue: { close } }],
    }).compileComponents();
    fixture = TestBed.createComponent(FinderFilterDrawer);
    fixture.componentRef.setInput('title', 'Player filters');
    fixture.componentRef.setInput('titleId', 'player-filter-title');
    fixture.componentRef.setInput('canClear', false);
    await fixture.whenStable();
  });

  it('labels the drawer and exposes staged actions', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const clear = await loader.getHarness(MatButtonHarness.with({ text: 'Clear all' }));
    const cancel = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    const apply = await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }));
    const applySpy = vi.fn();
    fixture.componentInstance.apply.subscribe(applySpy);

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.filter-drawer')
        ?.getAttribute('aria-labelledby'),
    ).toBe('player-filter-title');
    expect(await clear.isDisabled()).toBe(true);

    fixture.componentRef.setInput('canClear', true);
    await fixture.whenStable();
    expect(await clear.isDisabled()).toBe(false);

    await apply.click();
    expect(applySpy).toHaveBeenCalledOnce();
    await cancel.click();
    expect(close).toHaveBeenCalledOnce();
  });

  it('uses a full-height right-side dialog configuration', () => {
    expect(finderFilterDialogConfig('filter-title')).toMatchObject({
      ariaLabelledBy: 'filter-title',
      ariaModal: true,
      autoFocus: 'first-tabbable',
      height: '100vh',
      maxHeight: '100vh',
      maxWidth: '100vw',
      panelClass: 'finder-filter-drawer-panel',
      position: { right: '0', top: '0' },
      restoreFocus: true,
      width: '28rem',
    });
  });

  it('has no detectable AXE violations', async () => {
    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });
});
