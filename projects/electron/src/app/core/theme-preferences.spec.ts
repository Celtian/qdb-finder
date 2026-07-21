import { TestBed } from '@angular/core/testing';
import { ThemePreferences, themePreferenceKey } from './theme-preferences';

describe('ThemePreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('color-scheme');
  });

  it('applies system mode by default during service initialization', () => {
    const preferences = TestBed.inject(ThemePreferences);

    expect(preferences.preference()).toBe('system');
    expect(document.documentElement.dataset['theme']).toBe('system');
    expect(document.documentElement.style.colorScheme).toBe('light dark');
  });

  it('restores and applies a valid stored preference', () => {
    window.localStorage.setItem(themePreferenceKey, 'dark');

    const preferences = TestBed.inject(ThemePreferences);

    expect(preferences.preference()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('persists explicit changes and rejects unknown stored values', () => {
    window.localStorage.setItem(themePreferenceKey, 'sepia');
    const preferences = TestBed.inject(ThemePreferences);
    expect(preferences.preference()).toBe('system');

    preferences.set('light');

    expect(window.localStorage.getItem(themePreferenceKey)).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
