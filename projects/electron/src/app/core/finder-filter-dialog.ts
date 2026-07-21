import type { MatDialogConfig } from '@angular/material/dialog';

export const finderFilterDialogConfig = (ariaLabelledBy: string): MatDialogConfig => ({
  ariaLabelledBy,
  ariaModal: true,
  autoFocus: 'first-tabbable',
  delayFocusTrap: false,
  disableClose: false,
  height: '100vh',
  maxHeight: '100vh',
  maxWidth: '100vw',
  panelClass: 'finder-filter-drawer-panel',
  position: { right: '0', top: '0' },
  restoreFocus: true,
  width: '28rem',
});
