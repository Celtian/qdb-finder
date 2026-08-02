import { NgOptimizedImage } from '@angular/common';
import { Component, booleanAttribute, computed, input } from '@angular/core';

import { type CountryCode, FLAG_PUBLIC_PATHS, type FlagSize } from './generated-flags';

export type CountryFlagSize = 'sm' | 'lg';

interface FlagImageSource {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

const FLAG_CODE_ALIASES: Readonly<Record<string, CountryCode>> = {
  an: 'cw',
};

const getFlagPath = (code: string, size: FlagSize): string =>
  `${FLAG_PUBLIC_PATHS.png}/${size}/${FLAG_CODE_ALIASES[code] ?? code}.png`;

@Component({
  selector: 'app-country-flag',
  imports: [NgOptimizedImage],
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.css',
})
export class CountryFlag {
  readonly code = input.required<string>();
  readonly countryName = input<string>();
  readonly size = input<CountryFlagSize>('sm');
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly alt = computed(() =>
    this.decorative() ? '' : (this.countryName() ?? this.code().toLocaleUpperCase('en')),
  );
  protected readonly image = computed<FlagImageSource>(() => {
    const code = this.code();
    if (this.size() === 'lg') {
      return {
        src: getFlagPath(code, '40x30'),
        srcset: `${getFlagPath(code, '40x30')} 1x, ${getFlagPath(code, '80x60')} 2x, ${getFlagPath(code, '120x90')} 3x`,
        width: 40,
        height: 30,
      };
    }
    return {
      src: getFlagPath(code, '20x15'),
      srcset: `${getFlagPath(code, '20x15')} 1x, ${getFlagPath(code, '40x30')} 2x, ${getFlagPath(code, '60x45')} 3x`,
      width: 20,
      height: 15,
    };
  });
}
