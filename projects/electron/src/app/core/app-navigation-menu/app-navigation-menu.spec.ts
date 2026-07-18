import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { provideRouter, Router } from '@angular/router';

import { AppNavigationMenu } from './app-navigation-menu';

describe('AppNavigationMenu', () => {
  let fixture: ComponentFixture<AppNavigationMenu>;
  let loader: HarnessLoader;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavigationMenu],
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', children: [] },
          { path: 'players', children: [] },
          { path: 'teams', children: [] },
          { path: 'leagues', children: [] },
          { path: 'referees', children: [] },
          { path: 'stadiums', children: [] },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavigationMenu);
    loader = TestbedHarnessEnvironment.loader(fixture);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('renders an accessible trigger and six icon-labelled destinations', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const menu = await loader.getHarness(MatMenuHarness.with({ triggerIconName: 'menu' }));

    expect(element.querySelector('[aria-label="Open main navigation"]')).toBeTruthy();

    await menu.open();
    const items = await menu.getItems();
    const icons = [...document.querySelectorAll('.mat-mdc-menu-panel mat-icon')].map((icon) =>
      icon.textContent?.trim(),
    );

    expect(items).toHaveLength(6);
    expect(await menu.getItems({ text: /Home/ })).toHaveLength(1);
    expect(await menu.getItems({ text: /Players/ })).toHaveLength(1);
    expect(await menu.getItems({ text: /Teams/ })).toHaveLength(1);
    expect(await menu.getItems({ text: /Leagues/ })).toHaveLength(1);
    expect(await menu.getItems({ text: /Referees/ })).toHaveLength(1);
    expect(await menu.getItems({ text: /Stadiums/ })).toHaveLength(1);
    expect(icons).toEqual(['home', 'groups', 'shield', 'emoji_events', 'sports', 'stadium']);
  });

  it('navigates to a destination and closes the menu', async () => {
    const menu = await loader.getHarness(MatMenuHarness);

    await menu.open();
    await menu.clickItem({ text: /Teams/ });
    await fixture.whenStable();

    expect(router.url).toBe('/teams');
    expect(await menu.isOpen()).toBe(false);
  });

  it('marks only the active route as the current page', async () => {
    const menu = await loader.getHarness(MatMenuHarness);

    await router.navigateByUrl('/players');
    await fixture.whenStable();
    await menu.open();

    expect(document.querySelector('a[href="/players"]')?.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('a[href="/"]')?.hasAttribute('aria-current')).toBe(false);

    await menu.close();
    await router.navigateByUrl('/');
    await fixture.whenStable();
    await menu.open();

    expect(document.querySelector('a[href="/"]')?.getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('a[href="/players"]')?.hasAttribute('aria-current')).toBe(false);
  });
});
