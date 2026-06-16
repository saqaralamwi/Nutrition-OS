const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.expo' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

const rootDir = path.join(__dirname, '..');
const appDir = path.join(rootDir, 'app');
const srcDir = path.join(rootDir, 'src');

console.log('Scanning imports and globals for native blockers...');

const blockers = [];

const nodeBuiltins = ['fs', 'path', 'crypto', 'stream', 'os', 'child_process'];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(rootDir, filePath);
  
  // 1. Check for node builtin imports
  nodeBuiltins.forEach(mod => {
    const importRegex = new RegExp(`from\\s+['"]${mod}['"]|require\\(['"]${mod}['"]\\)`, 'g');
    if (importRegex.test(content)) {
      blockers.push({
        file: relativePath,
        type: 'node-builtin-import',
        detail: `Imports node builtin "${mod}"`
      });
    }
  });

  // 2. Check for window/document mutations or unsafe usage
  // We want to find references to window or document that are not protected by Platform.OS === 'web'
  const windowRegex = /\b(window|document)\b/g;
  let match;
  while ((match = windowRegex.exec(content)) !== null) {
    // Check if the file name ends with .web.tsx or .web.ts. If so, it's safe.
    if (relativePath.includes('.web.')) continue;
    
    // Check if it's safe usage, e.g., typeof window !== 'undefined'
    const contextStart = Math.max(0, match.index - 50);
    const contextEnd = Math.min(content.length, match.index + 50);
    const context = content.substring(contextStart, contextEnd).replace(/\r?\n/g, ' ');
    
    // If it's part of a safe check like "typeof window", "typeof document", "Platform.OS === 'web'"
    const isCheck = /typeof\s+window|typeof\s+document|Platform\.OS\s*===\s*['"]web['"]/.test(context);
    if (!isCheck) {
      blockers.push({
        file: relativePath,
        type: 'unsafe-browser-global',
        detail: `Found raw global reference: "${match[0]}". Context: "...${context.trim()}..."`
      });
    }
  }
}

if (fs.existsSync(appDir)) walkDir(appDir, scanFile);
if (fs.existsSync(srcDir)) walkDir(srcDir, scanFile);

console.log(JSON.stringify(blockers, null, 2));
