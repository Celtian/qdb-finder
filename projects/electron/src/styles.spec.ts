import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  imports: [MatButtonModule, MatTableModule],
  templateUrl: './styles.spec.html',
  styleUrl: './styles.css',
})
class PageHeaderStyleHost {
  protected readonly columns = ['name'];
  protected readonly materialStickyHeaderZIndex = 100;
  protected readonly rows = [{ name: 'Referee' }];
}

describe('application page header styles', () => {
  it('applies direct Tailwind page-header classes to every route-header variant', async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderStyleHost] }).compileComponents();
    const fixture = TestBed.createComponent(PageHeaderStyleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const headers = element.querySelectorAll<HTMLElement>('header');
    expect(headers).toHaveLength(3);
    expect(
      [...headers].every(
        (header) =>
          header.classList.contains('sticky') &&
          header.classList.contains('top-0') &&
          header.classList.contains('z-200') &&
          header.classList.contains('bg-surface-container-lowest'),
      ),
    ).toBe(true);
  });
});
