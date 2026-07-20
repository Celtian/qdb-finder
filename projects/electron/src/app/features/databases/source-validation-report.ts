import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { DatabaseSourceValidationReport as ValidationReport } from '../../core/qdb-contracts';

@Component({
  selector: 'app-source-validation-report',
  imports: [MatIconModule],
  templateUrl: './source-validation-report.html',
  styleUrl: './source-validation-report.css',
})
export class SourceValidationReport {
  readonly report = input.required<ValidationReport>();

  protected readonly errors = computed(() =>
    this.report()
      .issues.filter((issue) => issue.severity === 'error')
      .map((issue, index) => ({ ...issue, key: `error:${issue.code}:${issue.file}:${index}` })),
  );
  protected readonly warnings = computed(() =>
    this.report()
      .issues.filter((issue) => issue.severity === 'warning')
      .map((issue, index) => ({ ...issue, key: `warning:${issue.code}:${issue.file}:${index}` })),
  );
}
