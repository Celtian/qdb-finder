import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { FLAGS } from '../../projects/electron/src/app/core/country-flag/generated-flags';

describe('generated flag assets', () => {
  it.each([
    [20, 15],
    [40, 30],
    [60, 45],
    [80, 60],
    [120, 90],
  ])('generates %i×%i PNGs with exact dimensions', async (width, height) => {
    const image = sharp(
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

    await expect(image.metadata()).resolves.toMatchObject({ width, height, format: 'png' });
  });

  it.each(['ac', 'cp', 'cq', 'dg', 'ea', 'gb-eng', 'gb-nir', 'gb-sct', 'gb-wls', 'ic', 'ta'])(
    'includes generated special identifier %s',
    async (code) => {
      const metadata = await sharp(
        resolve(process.cwd(), 'projects', 'electron', 'public', 'flags', '40x30', `${code}.png`),
      ).metadata();

      expect(metadata).toMatchObject({ width: 40, height: 30, format: 'png' });
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
