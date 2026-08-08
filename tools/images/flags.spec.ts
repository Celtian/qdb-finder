import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FLAGS } from '../../projects/electron/src/app/core/country-flag/generated-flags';

const readPngDimensions = async (path: string): Promise<readonly [number, number]> => {
  const image = await readFile(path);

  expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(image.toString('ascii', 12, 16)).toBe('IHDR');
  return [image.readUInt32BE(16), image.readUInt32BE(20)];
};

describe('generated flag assets', () => {
  it.each([
    [20, 15],
    [40, 30],
    [60, 45],
    [80, 60],
    [120, 90],
  ])('generates %i×%i PNGs with exact dimensions', async (width, height) => {
    const dimensions = await readPngDimensions(
      resolve(
        process.cwd(),
        'projects',
        'electron',
        'public',
        'flags',
        `${width}x${height}`,
        'br.png',
      ),
    );

    expect(dimensions).toEqual([width, height]);
  });

  it.each(['ac', 'cp', 'cq', 'dg', 'ea', 'gb-eng', 'gb-nir', 'gb-sct', 'gb-wls', 'ic', 'ta'])(
    'includes generated special identifier %s',
    async (code) => {
      const dimensions = await readPngDimensions(
        resolve(process.cwd(), 'projects', 'electron', 'public', 'flags', '40x30', `${code}.png`),
      );

      expect(dimensions).toEqual([40, 30]);
    },
  );

  it.each(['us-ca', 'ca-on', 'au-nsw', 'de-be', 'es-ct', 'it-62'])(
    'excludes blacklisted subdivision %s',
    async (code) => {
      await expect(
        access(
          resolve(process.cwd(), 'projects', 'electron', 'public', 'flags', '40x30', `${code}.png`),
        ),
      ).rejects.toThrow();
      expect(Object.hasOwn(FLAGS, code)).toBe(false);
    },
  );
});
