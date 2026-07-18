import { TestBed } from '@angular/core/testing';
import type { QdbWindowApi } from '../qdb-contracts';
import { WindowTitlebar } from './window-titlebar';

describe('WindowTitlebar', () => {
  let maximizedListener: ((maximized: boolean) => void) | undefined;
  const windowApi: QdbWindowApi = {
    minimize: vi.fn(() => Promise.resolve()),
    toggleMaximize: vi.fn(async () => maximizedListener?.(true)),
    close: vi.fn(() => Promise.resolve()),
    isMaximized: vi.fn(() => Promise.resolve(false)),
    onMaximizedChange: vi.fn((listener) => {
      maximizedListener = listener;
      return () => {
        maximizedListener = undefined;
      };
    }),
  };

  beforeEach(async () => {
    maximizedListener = undefined;
    window.qdbWindow = windowApi;
    vi.clearAllMocks();
    await TestBed.configureTestingModule({ imports: [WindowTitlebar] }).compileComponents();
  });

  afterEach(() => {
    window.qdbWindow = undefined;
  });

  it('renders the app identity and accessible window controls', async () => {
    const fixture = TestBed.createComponent(WindowTitlebar);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.brand')?.textContent).toContain('QDB Finder');
    expect(element.querySelectorAll('button')).toHaveLength(3);
    expect(element.querySelector('[aria-label="Minimize window"]')).toBeTruthy();
    expect(element.querySelector('[aria-label="Maximize window"]')).toBeTruthy();
    expect(element.querySelector('[aria-label="Close window"]')).toBeTruthy();
  });

  it('delegates all window actions to the preload API', async () => {
    const fixture = TestBed.createComponent(WindowTitlebar);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('[aria-label="Minimize window"]')?.click();
    element.querySelector<HTMLButtonElement>('[aria-label="Maximize window"]')?.click();
    element.querySelector<HTMLButtonElement>('[aria-label="Close window"]')?.click();
    await fixture.whenStable();

    expect(windowApi.minimize).toHaveBeenCalledOnce();
    expect(windowApi.toggleMaximize).toHaveBeenCalledOnce();
    expect(windowApi.close).toHaveBeenCalledOnce();
    expect(element.querySelector('[aria-label="Restore window"]')).toBeTruthy();
  });
});
