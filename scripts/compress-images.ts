import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'compressed');
const QUALITY = 70;
const MAX_WIDTH = 1920;

async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function compressImage(inputPath: string, outputPath: string): Promise<void> {
  const ext = path.extname(inputPath).toLowerCase();
  const metadata = await sharp(inputPath).metadata();

  let pipeline = sharp(inputPath);

  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const outputExt = path.extname(outputPath).toLowerCase();

  if (ext === '.png' || outputExt === '.webp') {
    await pipeline
      .webp({ quality: QUALITY })
      .toFile(outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
  } else {
    await pipeline
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(outputPath);
  }
}

async function walkDir(dir: string): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      const relativePath = path.relative(INPUT_DIR, fullPath);
      const outputPath = path.join(OUTPUT_DIR, relativePath);
      const outputDir = path.dirname(outputPath);

      await ensureDir(outputDir);

      try {
        await compressImage(fullPath, outputPath);
        const originalSize = fs.statSync(fullPath).size;
        const compressedSize = fs.statSync(
          outputPath.replace(/\.(png|jpg|jpeg)$/i, '.webp'),
        ).size;

        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        console.log(`Compressed: ${relativePath} (${savings}% savings)`);
      } catch (error) {
        console.error(`Failed to compress ${relativePath}:`, error);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('Starting image compression...');
  console.log(`Input: ${INPUT_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Quality: ${QUALITY}, Max Width: ${MAX_WIDTH}px`);

  await ensureDir(OUTPUT_DIR);

  if (!fs.existsSync(INPUT_DIR)) {
    console.log('No images directory found. Creating placeholder.');
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log('Done - no images to compress.');
    return;
  }

  await walkDir(INPUT_DIR);
  console.log('Image compression complete.');
}

main().catch(console.error);
