const fs = require('fs');
const path = require('path');

function addImport(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) {
            addImport(file);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let data = fs.readFileSync(file, 'utf8');
            if (data.includes('<PageHeader') && !data.includes('import { PageHeader }')) {
                data = "import { PageHeader } from '@/components/layout/PageHeader';\n" + data;
                fs.writeFileSync(file, data, 'utf8');
                console.log('Added PageHeader import to: ' + file);
            }
        }
    });
}
addImport('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/pages');
