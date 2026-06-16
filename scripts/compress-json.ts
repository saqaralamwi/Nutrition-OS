import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DATA_DIRS = [
  path.join(__dirname, '..', 'src', 'data'),
  path.join(__dirname, '..', 'src', 'db', 'seedData'),
];

const ALLOWED_EXTENSIONS = ['.json'];

function shouldCompress(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
  if (filePath.endsWith('.min.json')) return false;
  const size = fs.statSync(filePath).size;
  return size > 1024 * 10;
}

async function compressJsonFile(inputPath: string): Promise<void> {
  const content = fs.readFileSync(inputPath, 'utf-8');

  const minified = JSON.stringify(JSON.parse(content));

  const gzipped = zlib.gzipSync(minified, { level: 9 });

  const originalSize = Buffer.byteLength(content, 'utf-8');
  const minifiedSize = Buffer.byteLength(minified, 'utf-8');
  const compressedSize = gzipped.length;

  const minifiedPath = inputPath.replace(/\.json$/, '.min.json');
  const gzipPath = inputPath + '.gz';

  fs.writeFileSync(minifiedPath, minified);
  fs.writeFileSync(gzipPath, gzipped);

  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  console.log(`${path.basename(inputPath)}:`);
  console.log(`  Original: ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`  Minified: ${(minifiedSize / 1024).toFixed(1)} KB`);
  console.log(`  Gzipped:  ${(compressedSize / 1024).toFixed(1)} KB (${savings}% savings)`);
}

async function walkDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else if (shouldCompress(fullPath)) {
      await compressJsonFile(fullPath);
    }
  }
}

async function main(): Promise<void> {
  console.log('Starting JSON compression...');

  for (const dir of DATA_DIRS) {
    if (fs.existsSync(dir)) {
      console.log(`\nProcessing: ${dir}`);
      await walkDir(dir);
    } else {
      console.log(`\nDirectory not found: ${dir}`);
    }
  }

  console.log('\nJSON compression complete.');
}

main().catch(console.error);
