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

const appDir = path.join(__dirname, '..', 'app');
const compDir = path.join(__dirname, '..', 'src', 'presentation', 'components');

console.log('Searching in app/ and components/ for SafeAreaView, paddingTop, and notch handling...');

const results = [];

function searchFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  
  const hasSafeArea = content.includes('SafeAreaView');
  const hasSafeAreaContext = content.includes('react-native-safe-area-context');
  const hasPaddingTop = content.includes('paddingTop');
  const hasConstants = content.includes('expo-constants') || content.includes('Constants.statusBarHeight');
  
  if (hasSafeArea || hasSafeAreaContext || hasPaddingTop || hasConstants) {
    results.push({
      file: relativePath,
      hasSafeArea,
      hasSafeAreaContext,
      hasPaddingTop,
      hasConstants,
      lines: content.split('\n').map((line, idx) => ({ line, num: idx + 1 })).filter(item => 
        item.line.includes('SafeAreaView') || 
        item.line.includes('paddingTop') || 
        item.line.includes('statusBarHeight')
      )
    });
  }
}

if (fs.existsSync(appDir)) walkDir(appDir, searchFile);
if (fs.existsSync(compDir)) walkDir(compDir, searchFile);

console.log(JSON.stringify(results, null, 2));
