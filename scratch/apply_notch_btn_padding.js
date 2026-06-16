const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'app/patient/[id]/calculations.tsx',
  'app/patient/[id]/clinical-analysis.tsx',
  'app/patient/[id]/diet-plan.tsx',
  'app/patient/[id]/discharge.tsx',
  'app/patient/[id]/screening.tsx',
  'app/patient/[id]/stamp.tsx',
  'app/patient/[id].tsx'
];

const rootDir = path.join(__dirname, '..');

filesToEdit.forEach(fileRelPath => {
  const filePath = path.join(rootDir, fileRelPath);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${fileRelPath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace top: 54 with top: safeHeaderPaddingTop - 6 or similar
  // We want to handle both top: 54 and top: 54,
  const targetRegex = /\btop:\s*54\b/g;
  
  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, 'top: safeHeaderPaddingTop - 6');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated button top layout in: ${fileRelPath}`);
  } else {
    console.log(`No match for top: 54 in: ${fileRelPath}`);
  }
});

console.log('Button layout updates complete!');
