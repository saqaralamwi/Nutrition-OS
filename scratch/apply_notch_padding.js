const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'app/index.tsx',
  'app/about.tsx',
  'app/patient/[id].tsx',
  'app/patient/[id]/calculations.tsx',
  'app/patient/[id]/clinical-analysis.tsx',
  'app/patient/[id]/diet-plan.tsx',
  'app/patient/[id]/discharge.tsx',
  'app/patient/[id]/icu-admission.tsx',
  'app/patient/[id]/intervention.tsx',
  'app/patient/[id]/lab-trends.tsx',
  'app/patient/[id]/laboratory.tsx',
  'app/patient/[id]/medical-history.tsx',
  'app/patient/[id]/medications.tsx',
  'app/patient/[id]/monitoring.tsx',
  'app/patient/[id]/nutrition-calculator.tsx',
  'app/patient/[id]/ocr.tsx',
  'app/patient/[id]/physical-exam.tsx',
  'app/patient/[id]/screening.tsx',
  'app/patient/[id]/social-history.tsx',
  'app/patient/[id]/stamp.tsx'
];

const rootDir = path.join(__dirname, '..');

filesToEdit.forEach(fileRelPath => {
  const filePath = path.join(rootDir, fileRelPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${fileRelPath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Check if safeHeaderPaddingTop is already imported
  if (content.includes('safeHeaderPaddingTop')) {
    console.log(`Already has safeHeaderPaddingTop: ${fileRelPath}`);
    return;
  }
  
  // 2. Add safeHeaderPaddingTop to theme imports
  // We match imports from relative paths ending with /theme
  // Example: import { colors, spacing } from '../../presentation/theme';
  // Example: import { colors, spacing, fontFamilies } from '../theme';
  const importThemeRegex = /(import\s+\{\s*([^}]+)\s*\}\s+from\s+['"][^'"]*theme['"];?)/g;
  
  let updatedContent = content;
  let hasThemeImport = false;
  
  updatedContent = content.replace(importThemeRegex, (match, p1, p2) => {
    hasThemeImport = true;
    if (p2.includes('safeHeaderPaddingTop')) {
      return match;
    }
    // Clean and split import specifiers
    const specifiers = p2.split(',').map(s => s.trim());
    specifiers.push('safeHeaderPaddingTop');
    
    // Construct new import statement
    const newSpecifiers = specifiers.join(', ');
    const fromPart = match.substring(match.indexOf('from'));
    return `import { ${newSpecifiers} } ${fromPart}`;
  });
  
  if (!hasThemeImport) {
    console.warn(`No theme import found in: ${fileRelPath}`);
    return;
  }
  
  // 3. Replace hardcoded header paddings
  // We want to replace "paddingTop: 60" or "paddingTop: 50" inside style objects
  // but only when they are part of styles, usually "paddingTop: 60," or "paddingTop: 50,"
  // We should make sure we don't match the div inline styles in html wrappers (like patient/[id].tsx)
  // Inside stylesheets, they are key-value pairs in JS: paddingTop: 60
  
  // Let's replace 'paddingTop: 60' and 'paddingTop: 50' when followed by a comma or closing curly brace
  // and preceded by whitespace or curly brace.
  const padding60Regex = /\bpaddingTop:\s*60\b/g;
  const padding50Regex = /\bpaddingTop:\s*50\b/g;
  
  let paddingReplaced = false;
  if (padding60Regex.test(updatedContent)) {
    updatedContent = updatedContent.replace(padding60Regex, 'paddingTop: safeHeaderPaddingTop');
    paddingReplaced = true;
  }
  if (padding50Regex.test(updatedContent)) {
    updatedContent = updatedContent.replace(padding50Regex, 'paddingTop: safeHeaderPaddingTop');
    paddingReplaced = true;
  }
  
  if (paddingReplaced) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Successfully updated: ${fileRelPath}`);
  } else {
    console.warn(`No hardcoded padding (50 or 60) replaced in: ${fileRelPath}`);
  }
});
console.log('Notch padding updates complete!');
