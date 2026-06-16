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

console.log('Searching for top positions inside stylesheet objects...');

const results = [];

const topPosRegex = /\btop:\s*(5\d|6\d|4\d|3\d)\b/g;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(rootDir, filePath);
  
  let match;
  while ((match = topPosRegex.exec(content)) !== null) {
    const contextStart = Math.max(0, match.index - 40);
    const contextEnd = Math.min(content.length, match.index + 40);
    const context = content.substring(contextStart, contextEnd).replace(/\r?\n/g, ' ');
    
    results.push({
      file: relativePath,
      match: match[0],
      context: context.trim()
    });
  }
}

if (fs.existsSync(appDir)) walkDir(appDir, scanFile);

console.log(JSON.stringify(results, null, 2));
