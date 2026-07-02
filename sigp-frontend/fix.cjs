const fs = require('fs');
let c = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
c = c.replace(/<Card>/g, '<Card className="min-w-0">');
c = c.replace(/<Card className="((?!min-w-0)[^"]*)"/g, '<Card className="min-w-0 $1"');
fs.writeFileSync('src/pages/DashboardPage.tsx', c);
