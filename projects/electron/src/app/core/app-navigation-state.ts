import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, effect, inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export const APP_NAVIGATION_BREAKPOINT = '(max-width: 760px)';

@Service()
export class AppNavigationState {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly mobileOpenState = signal(false);
  private restoreTarget?: HTMLElement;
  private restoreAfterClose = false;

  readonly isSmallScreen = toSignal(
    this.breakpointObserver.observe(APP_NAVIGATION_BREAKPOINT).pipe(map(({ matches }) => matches)),
    { initialValue: this.breakpointObserver.isMatched(APP_NAVIGATION_BREAKPOINT) },
  );
  readonly mobileOpen = this.mobileOpenState.asReadonly();
  readonly expanded = computed(() => !this.isSmallScreen() || this.mobileOpen());

  constructor() {
    effect(() => {
      if (this.isSmallScreen()) return;
      this.mobileOpenState.set(false);
      this.restoreTarget = undefined;
      this.restoreAfterClose = false;
    });
  }

  open(trigger: HTMLElement): void {
    if (!this.isSmallScreen()) return;
    this.restoreTarget = trigger;
    this.restoreAfterClose = true;
    this.mobileOpenState.set(true);
  }

  dismiss(): void {
    if (!this.mobileOpenState()) return;
    this.mobileOpenState.set(false);
  }

  destinationSelected(): void {
    this.mobileOpenState.set(false);
    this.restoreTarget = undefined;
    this.restoreAfterClose = false;
  }

  closeForDialog(): void {
    this.mobileOpenState.set(false);
    this.restoreAfterClose = false;
  }

  drawerStateChanged(opened: boolean): void {
    if (!this.isSmallScreen()) return;
    if (!opened) this.mobileOpenState.set(false);
  }

  drawerClosed(): void {
    if (!this.restoreAfterClose) return;
    this.restoreAfterClose = false;
    this.restoreTriggerFocus();
  }

  restoreTriggerFocus(): void {
    const target = this.restoreTarget;
    this.restoreTarget = undefined;
    this.restoreAfterClose = false;
    if (!target?.isConnected) return;
    queueMicrotask(() => target.focus());
  }
}
