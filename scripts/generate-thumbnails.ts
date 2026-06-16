import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const THUMB_DIR = path.join(__dirname, '..', 'assets', 'images', 'thumbnails');
const THUMB_SIZES = [150, 300, 600];

async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  size: number,
): Promise<void> {
  await sharp(inputPath)
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 60 })
    .toFile(outputPath);
}

async function walkDir(dir: string): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) continue;
    if (!/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) continue;

    const baseName = path.parse(entry.name).name;

    for (const size of THUMB_SIZES) {
      const thumbDir = path.join(THUMB_DIR, `${size}px`);
      await ensureDir(thumbDir);
      const thumbPath = path.join(thumbDir, `${baseName}.webp`);

      try {
        await generateThumbnail(fullPath, thumbPath, size);
        console.log(`Thumbnail ${size}px: ${baseName}.webp`);
      } catch (error) {
        console.error(`Failed thumbnail for ${entry.name} at ${size}px:`, error);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('Starting thumbnail generation...');

  await ensureDir(THUMB_DIR);

  if (!fs.existsSync(INPUT_DIR)) {
    console.log('No images directory found. Creating placeholder.');
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log('Done - no images to process.');
    return;
  }

  await walkDir(INPUT_DIR);
  console.log('Thumbnail generation complete.');
}

main().catch(console.error);
