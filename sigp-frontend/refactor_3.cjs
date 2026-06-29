const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            processDir(file);
        } else if (file.endsWith('.tsx')) {
            let data = fs.readFileSync(file, 'utf8');
            let original = data;

            data = data.replace(
                /<h1 className="[^"]*">([\s\S]*?)<\/h1>\s*<p className="[^"]*">([\s\S]*?)<\/p>/g,
                '<PageHeader title={`$1`} description={`$2`} />'
            );

            data = data.replace(
                /<h1 className="[^"]*">([\s\S]*?)<\/h1>/g,
                (match, p1) => {
                    if (file.includes('LoginPage.tsx') || file.includes('UICatalogPage.tsx')) return match; 
                    return `<PageHeader title={\`${p1}\`} />`;
                }
            );

            if (data !== original) {
                if (!data.includes('PageHeader')) {
                    data = "import { PageHeader } from '@/components/layout/PageHeader';\n" + data;
                }
                data = data.replace(/title={`([^${}]+)`}/g, 'title="$1"');
                data = data.replace(/description={`([^${}]+)`}/g, 'description="$1"');

                // Cleanup trailing whitespace in interpolated titles
                data = data.replace(/title="([^"]+?)\s+"/g, 'title="$1"');

                fs.writeFileSync(file, data, 'utf8');
                console.log('Modified PageHeader in: ' + file);
            }
        }
    });
}

processDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/pages');

