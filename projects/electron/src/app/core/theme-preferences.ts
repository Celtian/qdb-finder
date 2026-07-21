import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

export const themePreferenceKey = 'qdb-finder.theme';

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

@Service()
export class ThemePreferences {
  private readonly document = inject(DOCUMENT);
  private readonly preferenceState = signal<ThemePreference>(this.load());

  readonly preference = this.preferenceState.asReadonly();

  constructor() {
    this.apply(this.preferenceState());
  }

  initialize(): void {
    this.apply(this.preferenceState());
  }

  set(preference: ThemePreference): void {
    this.preferenceState.set(preference);
    this.apply(preference);
    try {
      this.document.defaultView?.localStorage.setItem(themePreferenceKey, preference);
    } catch {
      // The selected theme still applies for this session when storage is unavailable.
    }
  }

  private load(): ThemePreference {
    try {
      const preference = this.document.defaultView?.localStorage.getItem(themePreferenceKey);
      return isThemePreference(preference) ? preference : 'system';
    } catch {
      return 'system';
    }
  }

  private apply(preference: ThemePreference): void {
    const root = this.document.documentElement;
    root.dataset['theme'] = preference;
    root.style.colorScheme = preference === 'system' ? 'light dark' : preference;
  }
}
