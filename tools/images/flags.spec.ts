import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

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

  it.each(['an', 'gb-eng', 'gb-nir', 'gb-sct', 'gb-wls'])(
    'includes generated special identifier %s',
    async (code) => {
      const metadata = await sharp(
        resolve(process.cwd(), 'projects', 'electron', 'public', 'flags', '40x30', `${code}.png`),
      ).metadata();

      expect(metadata).toMatchObject({ width: 40, height: 30, format: 'png' });
    },
  );
});
