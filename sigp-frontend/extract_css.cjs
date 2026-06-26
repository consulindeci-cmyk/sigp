const fs = require('fs');
const content = fs.readFileSync('gpd-erp.html', 'utf8');
const match = content.match(/<style>([\s\S]*?)<\/style>/);
if (match) {
  fs.writeFileSync('src/index.css', match[1].trim());
  console.log('CSS extracted successfully.');
} else {
  console.log('Could not find <style> tags.');
}
