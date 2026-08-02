export interface DatabaseInfo {
  id: string;
  name: string;
  kind: DatabaseKind;
  schemaVersion: number;
  editions: number;
  teamEditions: number;
  leagueEditions: number;
  refereeEditions: number;
  stadiumEditions: number;
  teamLinks: number;
  sourceFiles: number;
  versions: number[];
  generatedAt: string;
  sqliteVersion: string;
}

export type DatabaseKind = 'built-in' | 'custom';
export type DatabaseStatus = 'available' | 'incompatible';

export interface DatabaseDescriptor extends DatabaseInfo {
  status: DatabaseStatus;
  error?: string;
}

export type DatabaseSourceKind = 'text-folder' | 't3db';

interface DatabaseSourceSelectionBase {
  id: string;
  kind: DatabaseSourceKind;
  suggestedName: string;
  detection: 'detected' | 'ambiguous' | 'unknown';
  detectedVersion?: number;
}

export interface TextDatabaseSourceSelection extends DatabaseSourceSelectionBase {
  kind: 'text-folder';
  displayPath: string;
}

export interface T3dbDatabaseSourceSelection extends DatabaseSourceSelectionBase {
  kind: 't3db';
  databaseDisplayPath: string;
  metadataDisplayPath: string;
}

export type DatabaseSourceSelection = TextDatabaseSourceSelection | T3dbDatabaseSourceSelection;

export interface DatabaseSourceFileSelection {
  id: string;
  displayPath: string;
  fileName: string;
}

export interface T3dbDatabaseSourcePreparationRequest {
  databaseFileId: string;
  metadataFileId: string;
}

export type DatabaseSourcePreparationResult =
  | { status: 'completed'; source: T3dbDatabaseSourceSelection }
  | { status: 'failed'; message: string };

export interface DatabaseImportRequest {
  requestId: string;
  selectionId: string;
  name: string;
  version: number;
}

export interface DatabaseSourceValidationRequest {
  requestId: string;
  selectionId: string;
  version: number;
}

export type DatabaseSourceValidationSeverity = 'error' | 'warning';

export type DatabaseSourceValidationIssueCode =
  | 'version-mismatch'
  | 'missing-files'
  | 'header-mismatch'
  | 'invalid-source'
  | 'malformed-row'
  | 'invalid-number'
  | 'unsafe-integer'
  | 'out-of-range'
  | 'duplicate-value'
  | 'missing-reference';

export interface DatabaseSourceValidationSample {
  line?: number;
  record?: number;
  value?: string;
}

export interface DatabaseSourceValidationIssue {
  severity: DatabaseSourceValidationSeverity;
  code: DatabaseSourceValidationIssueCode;
  file: string;
  field?: string;
  message: string;
  count: number;
  samples: DatabaseSourceValidationSample[];
}

export interface DatabaseSourceValidationReport {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  issues: DatabaseSourceValidationIssue[];
  omittedIssueGroups: number;
}

export type DatabaseSourceValidationResult =
  | { status: 'completed'; report: DatabaseSourceValidationReport }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

export interface DatabaseSourceValidationProgress {
  requestId: string;
  message: string;
}

export type DatabaseImportErrorCode =
  | 'version-mismatch'
  | 'missing-files'
  | 'header-mismatch'
  | 'invalid-source'
  | 'source-corrupted'
  | 'import-failed';

export interface DatabaseImportError {
  code: DatabaseImportErrorCode;
  message: string;
  files: string[];
  detectedVersion?: number;
  validation?: DatabaseSourceValidationReport;
}

export type DatabaseImportResult =
  | { status: 'completed'; database: DatabaseDescriptor }
  | { status: 'cancelled' }
  | { status: 'failed'; error: DatabaseImportError };

export interface DatabaseImportProgress {
  requestId: string;
  message: string;
}
