const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src', function(filePath) {
  if (filePath.endsWith('.ts')) { // apply to all TS files, including guards and specs
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Specifically target the "as any" or ": any" patterns safely
    content = content.replace(/as any/g, 'as unknown');
    content = content.replace(/: any(\s*[,;)=])/g, ': unknown$1');
    content = content.replace(/<any>/g, '<unknown>');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed any in:', filePath);
    }
  }
});
