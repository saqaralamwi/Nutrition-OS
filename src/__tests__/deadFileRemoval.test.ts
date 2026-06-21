import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { globSync } from 'glob';
import { readFileSync } from 'fs';

const DELETED_FILES = [
  'src/data/db.ts',
  'src/presentation/stores/syncStore.ts',
  'src/presentation/components/PickerField.tsx',
];

describe('Dead File Removal', () => {
  it.each(DELETED_FILES)('should not have %s', (filePath) => {
    expect(existsSync(filePath)).toBe(false);
  });

  it('should not import deleted files anywhere in src/', () => {
    const allFiles = globSync('src/**/*.{ts,tsx}', { ignore: 'node_modules/**' });
    const allCode = allFiles.map(f => readFileSync(f, 'utf-8')).join('\n');

    const dbPattern = /from\s+['"].*?db\.ts['"]/;
    const syncPattern = /from\s+['"].*?syncStore['"]/;
    const pickerPattern = /from\s+['"].*?PickerField['"]/;

    expect(allCode).not.toMatch(dbPattern);
    expect(allCode).not.toMatch(syncPattern);
    expect(allCode).not.toMatch(pickerPattern);
  });

  it('should have no remaining db.ts bootstrap file', () => {
    expect(existsSync('src/data/db.ts')).toBe(false);
  });

  it('should have no remaining syncStore file', () => {
    expect(existsSync('src/presentation/stores/syncStore.ts')).toBe(false);
  });

  it('should have no remaining PickerField component', () => {
    expect(existsSync('src/presentation/components/PickerField.tsx')).toBe(false);
  });
});
