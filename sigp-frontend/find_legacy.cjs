const fs = require('fs');
const path = require('path');

const legacy_terms = [
    '<table',
    'className="data-table"',
    'style={{',
    'bg-canvas',
    'text-slate',
    'text-navy',
    'className="panel"',
    'className="kpi-card"'
];

const results = Object.fromEntries(legacy_terms.map(t => [t, []]));
const src_dir = 'c:\\\\Users\\\\Baba Traore\\\\Documents\\\\mesApp\\\\projet\\\\sigp-frontend\\\\src';

function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walk(filepath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filepath, 'utf-8');
            for (const term of legacy_terms) {
                if (content.includes(term)) {
                    results[term].push(path.relative(src_dir, filepath));
                }
            }
        }
    }
}
walk(src_dir);

let out = '# Inventaire Legacy\\n\\n';
for (const [term, files] of Object.entries(results)) {
    out += '## ' + term + ' (' + files.length + ' fichiers)\\n';
    for (const f of files) {
        out += '- ' + f + '\\n';
    }
    out += '\\n';
}

const dir = 'c:\\\\Users\\\\Baba Traore\\\\.gemini\\\\antigravity-ide\\\\brain\\\\02c01e5d-5751-4142-a2fc-900a57c73d41\\\\scratch';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'legacy_inventory.md'), out);
console.log('done');
