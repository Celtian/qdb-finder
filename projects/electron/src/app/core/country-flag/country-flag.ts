import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, computed, input } from '@angular/core';

export type CountryFlagSize = 'sm' | 'lg';

interface FlagImageSource {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

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
        src: `/flags/40x30/${code}.png`,
        srcset: `/flags/40x30/${code}.png 1x, /flags/80x60/${code}.png 2x, /flags/120x90/${code}.png 3x`,
        width: 40,
        height: 30,
      };
    }
    return {
      src: `/flags/20x15/${code}.png`,
      srcset: `/flags/20x15/${code}.png 1x, /flags/40x30/${code}.png 2x, /flags/60x45/${code}.png 3x`,
      width: 20,
      height: 15,
    };
  });
}
