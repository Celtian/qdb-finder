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
  it('keeps every route-header variant above Material actions and sticky tables', async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderStyleHost] }).compileComponents();
    const fixture = TestBed.createComponent(PageHeaderStyleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const headers = element.querySelectorAll<HTMLElement>('.app-page-header');
    const actionLabel = element.querySelector<HTMLElement>('.mdc-button__label');
    const tableHeader = element.querySelector<HTMLElement>('.mat-mdc-header-row');

    expect(headers).toHaveLength(3);
    expect(actionLabel).toBeTruthy();
    expect(tableHeader).toBeTruthy();

    const actionZIndex = Number(getComputedStyle(actionLabel!).zIndex);
    const tableHeaderZIndex = Number(getComputedStyle(tableHeader!).zIndex);

    for (const header of headers) {
      const styles = getComputedStyle(header);
      expect(styles.position).toBe('sticky');
      expect(styles.top).toBe('0px');
      expect(styles.zIndex).toBe('200');
      expect(Number(styles.zIndex)).toBeGreaterThan(actionZIndex);
      expect(Number(styles.zIndex)).toBeGreaterThan(tableHeaderZIndex);
    }
  });
});
