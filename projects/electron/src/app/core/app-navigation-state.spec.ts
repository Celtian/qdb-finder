import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { APP_NAVIGATION_BREAKPOINT, AppNavigationState } from './app-navigation-state';

describe('AppNavigationState', () => {
  let breakpoint: BehaviorSubject<BreakpointState>;
  let navigation: AppNavigationState;

  beforeEach(() => {
    breakpoint = new BehaviorSubject<BreakpointState>({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => breakpoint.value.matches,
            observe: () => breakpoint.asObservable(),
          },
        },
      ],
    });
    navigation = TestBed.inject(AppNavigationState);
  });

  it('opens only on small screens and restores the originating trigger after dismissal', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);

    navigation.open(trigger);
    expect(navigation.mobileOpen()).toBe(true);
    navigation.dismiss();
    navigation.drawerClosed();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(navigation.mobileOpen()).toBe(false);
    trigger.remove();
  });

  it('resets mobile state when crossing to the persistent desktop sidebar', () => {
    const trigger = document.createElement('button');
    navigation.open(trigger);

    breakpoint.next({
      matches: false,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: false },
    });
    TestBed.tick();

    expect(navigation.isSmallScreen()).toBe(false);
    expect(navigation.mobileOpen()).toBe(false);
    expect(navigation.expanded()).toBe(true);
  });
});
