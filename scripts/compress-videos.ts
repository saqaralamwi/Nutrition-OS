import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const INPUT_DIR = path.join(__dirname, '..', 'assets', 'videos');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'videos', 'compressed');
const CRF = 28;
const MAX_WIDTH = 1280;

async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function compressVideo(inputPath: string, outputPath: string): Promise<void> {
  const ffmpegPath = 'ffmpeg';

  const args = [
    `-i "${inputPath}"`,
    `-c:v libx264`,
    `-crf ${CRF}`,
    `-vf "scale='min(${MAX_WIDTH},iw)':min_scale:-2"`,
    `-c:a aac`,
    `-b:a 128k`,
    `-movflags +faststart`,
    `-y`,
    `"${outputPath}"`,
  ];

  const cmd = `${ffmpegPath} ${args.join(' ')}`;

  try {
    const originalSize = fs.statSync(inputPath).size;
    execSync(cmd, { stdio: 'inherit' });
    const compressedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    console.log(`Compressed: ${path.basename(inputPath)} (${savings}% savings)`);
  } catch (error) {
    console.error(`Failed to compress ${path.basename(inputPath)}:`, error);
  }
}

async function walkDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) continue;
    if (!/\.(mp4|mov|avi|mkv)$/i.test(entry.name)) continue;

    const relativePath = path.relative(INPUT_DIR, fullPath);
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    await ensureDir(outputDir);

    await compressVideo(fullPath, outputPath);
  }
}

async function main(): Promise<void> {
  console.log('Starting video compression...');
  console.log(`Input: ${INPUT_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`CRF: ${CRF}, Max Width: ${MAX_WIDTH}px`);

  await ensureDir(OUTPUT_DIR);

  if (!fs.existsSync(INPUT_DIR)) {
    console.log('No videos directory found. Creating placeholder.');
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log('Done - no videos to compress.');
    return;
  }

  await walkDir(INPUT_DIR);
  console.log('Video compression complete.');
}

main().catch(console.error);
