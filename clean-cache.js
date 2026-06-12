const fs = require('fs');
const path = require('path');

const pathsToPurge = [
  path.join(__dirname, '.expo'),
  path.join(__dirname, 'node_modules', '.cache', 'metro')
];

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    console.log(`Purging: ${directoryPath}`);
    try {
      fs.rmSync(directoryPath, { recursive: true, force: true });
      console.log(`Successfully deleted: ${directoryPath}`);
    } catch (err) {
      console.error(`Error deleting ${directoryPath}:`, err.message);
    }
  } else {
    console.log(`Directory does not exist (already clean): ${directoryPath}`);
  }
}

pathsToPurge.forEach(dir => deleteFolderRecursive(dir));
console.log('Cache purge completed successfully.');
