import { mkdir, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

export const FLAG_SIZES = [
  { width: 20, height: 15 },
  { width: 40, height: 30 },
  { width: 60, height: 45 },
  { width: 80, height: 60 },
  { width: 120, height: 90 },
] as const;

export const buildFlags = async (
  inputFolder = join(process.cwd(), 'assets', 'flags'),
  outputFolder = join(process.cwd(), 'projects', 'electron', 'public', 'flags'),
): Promise<void> => {
  const files = (await readdir(inputFolder)).filter(
    (file) => extname(file).toLocaleLowerCase('en') === '.svg',
  );

  for (const { width, height } of FLAG_SIZES) {
    const sizeFolder = join(outputFolder, `${width}x${height}`);
    await mkdir(sizeFolder, { recursive: true });
    await Promise.all(
      files.map(async (file) => {
        const output = join(sizeFolder, `${file.slice(0, -extname(file).length)}.png`);
        await sharp(join(inputFolder, file))
          .resize(width, height, { fit: 'cover', position: 'center' })
          .png({ quality: 100, compressionLevel: 9, adaptiveFiltering: true })
          .toFile(output);
      }),
    );
  }
};

void buildFlags()
  .then(() => console.log(`Generated ${FLAG_SIZES.length} responsive sizes for all flag SVGs.`))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
