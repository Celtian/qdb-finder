import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryFlag } from './country-flag';

describe('CountryFlag', () => {
  let fixture: ComponentFixture<CountryFlag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CountryFlag] }).compileComponents();
    fixture = TestBed.createComponent(CountryFlag);
    fixture.componentRef.setInput('code', 'cz');
    await fixture.whenStable();
  });

  it('renders the small responsive sources and dimensions', () => {
    const element = fixture.nativeElement as HTMLElement;
    const source = element.querySelector('source');
    const image = element.querySelector('img');

    expect(source?.getAttribute('srcset')).toBe(
      '/flags/20x15/cz.png 1x, /flags/40x30/cz.png 2x, /flags/60x45/cz.png 3x',
    );
    expect(image?.getAttribute('width')).toBe('20');
    expect(image?.getAttribute('height')).toBe('15');
    expect(image?.getAttribute('alt')).toBe('CZ');
  });

  it('renders the large responsive sources and supplied accessible name', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(CountryFlag);
    fixture.componentRef.setInput('code', 'cz');
    fixture.componentRef.setInput('size', 'lg');
    fixture.componentRef.setInput('countryName', 'Czechia');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('source')?.getAttribute('srcset')).toBe(
      '/flags/40x30/cz.png 1x, /flags/80x60/cz.png 2x, /flags/120x90/cz.png 3x',
    );
    expect(element.querySelector('img')?.getAttribute('width')).toBe('40');
    expect(element.querySelector('img')?.getAttribute('height')).toBe('30');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Czechia');
  });

  it('is hidden from assistive technology in decorative mode', async () => {
    fixture.componentRef.setInput('decorative', true);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('picture')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});
