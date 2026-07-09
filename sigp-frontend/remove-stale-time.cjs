const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/hooks', function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Remove lines with staleTime or gcTime completely, or just the properties
    // Safest way is to remove lines containing "staleTime:" and "gcTime:" if they are single lines
    content = content.replace(/^\s*staleTime:\s*[^,]+,?\s*$/gm, '');
    content = content.replace(/^\s*gcTime:\s*[^,]+,?\s*$/gm, '');
    
    // Clean up empty lines that might have been left
    content = content.replace(/\n\s*\n/g, '\n\n');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Removed staleTime/gcTime from:', filePath);
    }
  }
});
