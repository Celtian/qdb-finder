import { describe, expect, it } from 'vitest';
import { t3dbSourceErrorMessage } from '../../projects/electron/electron/t3db-source';

describe('t3db source errors', () => {
  it.each([
    [
      new Error('Unexpected format version 7 in C:\\Games\\fifa_ng_db.db'),
      'The selected database is not a supported PC t3db format-8 database.',
    ],
    [
      new Error('Metadata XML schema failed near /private/fifa_ng_db-meta.xml'),
      'The metadata XML is invalid or does not match the selected t3db database.',
    ],
    [
      new Error('Decoder exploded at /private/fifa_ng_db.db:42'),
      'The selected t3db database could not be opened. Check both source files and try again.',
    ],
  ])('returns a sanitized blocking message', (error, expected) => {
    const message = t3dbSourceErrorMessage(error);

    expect(message).toBe(expected);
    expect(message).not.toContain('/private');
    expect(message).not.toContain('C:\\Games');
  });
});
