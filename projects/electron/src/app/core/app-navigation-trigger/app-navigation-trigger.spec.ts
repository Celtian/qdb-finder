import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { APP_NAVIGATION_BREAKPOINT, AppNavigationState } from '../app-navigation-state';
import { AppNavigationTrigger } from './app-navigation-trigger';

describe('AppNavigationTrigger', () => {
  let breakpoint: BehaviorSubject<BreakpointState>;

  beforeEach(async () => {
    breakpoint = new BehaviorSubject<BreakpointState>({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    await TestBed.configureTestingModule({
      imports: [AppNavigationTrigger],
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => breakpoint.value.matches,
            observe: () => breakpoint.asObservable(),
          },
        },
      ],
    }).compileComponents();
  });

  it('opens the mobile drawer with synchronized accessible state', async () => {
    const fixture = TestBed.createComponent(AppNavigationTrigger);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button',
    );

    expect(button?.getAttribute('aria-controls')).toBe('primary-navigation-drawer');
    expect(button?.getAttribute('aria-expanded')).toBe('false');
    button?.click();
    await fixture.whenStable();

    expect(TestBed.inject(AppNavigationState).mobileOpen()).toBe(true);
    expect(button?.getAttribute('aria-expanded')).toBe('true');
  });

  it('does not render a redundant trigger beside the desktop sidebar', async () => {
    const fixture = TestBed.createComponent(AppNavigationTrigger);
    await fixture.whenStable();

    breakpoint.next({
      matches: false,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: false },
    });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
