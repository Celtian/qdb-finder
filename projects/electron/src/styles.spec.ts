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
  it('applies the Tailwind page-header utility to every route-header variant', async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderStyleHost] }).compileComponents();
    const fixture = TestBed.createComponent(PageHeaderStyleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const headers = element.querySelectorAll<HTMLElement>('.app-page-header');
    expect(headers).toHaveLength(3);
    expect([...headers].map((header) => [...header.classList])).toEqual([
      ['app-page-header', 'page-heading'],
      ['app-page-header', 'topbar'],
      ['app-page-header', 'entity-topbar'],
    ]);
  });
});
