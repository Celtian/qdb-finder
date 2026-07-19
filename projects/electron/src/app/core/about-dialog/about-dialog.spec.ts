import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { VERSION_INFO } from '../../../../../version-info';
import { AboutDialog } from './about-dialog';

describe('AboutDialog', () => {
  let fixture: ComponentFixture<AboutDialog>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutDialog],
      providers: [{ provide: MatDialogRef, useValue: { close } }],
    }).compileComponents();

    close.mockClear();
    fixture = TestBed.createComponent(AboutDialog);
    await fixture.whenStable();
  });

  it('renders the generated version and compact application identity', () => {
    const element = fixture.nativeElement as HTMLElement;
    const expectedYear = new Date(VERSION_INFO.date).getUTCFullYear();

    expect(element.querySelector('h2[mat-dialog-title]')?.textContent).toContain('QDB Finder');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('');
    expect(element.textContent).toContain(`Version ${VERSION_INFO.version}`);
    expect(element.textContent).toContain('Fast, offline FIFA database search across FIFA 11–23.');
    expect(element.textContent).toContain(`© ${expectedYear} ${VERSION_INFO.author.name}`);
    expect(element.textContent).toContain('MIT License');
    expect(element.textContent).not.toContain(VERSION_INFO.git.branch);
    expect(element.textContent).not.toContain(VERSION_INFO.git.commit);
    expect(element.textContent).not.toContain(VERSION_INFO.date);
  });

  it('links to the documentation and repository in the external browser', () => {
    const element = fixture.nativeElement as HTMLElement;
    const documentation = element.querySelector<HTMLAnchorElement>('a[href*="celtian.github.io"]');
    const github = element.querySelector<HTMLAnchorElement>('a[href*="github.com"]');

    expect(documentation?.href).toBe('https://celtian.github.io/qdb-finder/');
    expect(github?.href).toBe('https://github.com/Celtian/qdb-finder');

    for (const link of [documentation, github]) {
      expect(link?.target).toBe('_blank');
      expect(link?.rel).toContain('noopener');
      expect(link?.getAttribute('aria-label')).toContain('browser');
    }
  });

  it('provides accessible header and footer close controls', () => {
    const element = fixture.nativeElement as HTMLElement;
    const headerClose = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Close About dialog"]',
    );
    const footerClose = [
      ...element.querySelectorAll<HTMLButtonElement>('mat-dialog-actions button'),
    ].find((button) => button.textContent?.trim() === 'Close');

    headerClose?.click();
    expect(close).toHaveBeenCalledOnce();

    close.mockClear();
    footerClose?.click();
    expect(close).toHaveBeenCalledOnce();
  });
});
