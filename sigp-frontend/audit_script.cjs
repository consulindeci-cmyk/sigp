const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src';

function getFiles(dir, ext = '.tsx') {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(getFiles(file, ext));
        } else if (file.endsWith(ext) || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = getFiles(srcDir);
const pages = allFiles.filter(f => f.includes('\\pages\\') || f.includes('/pages/'));
const components = allFiles.filter(f => f.includes('\\components\\') || f.includes('/components/'));
const hooks = allFiles.filter(f => f.includes('\\hooks\\') || f.includes('/hooks/'));
const mocks = allFiles.filter(f => f.includes('\\mocks\\') || f.includes('/mocks/') || f.includes('mock'));

let output = {};
output.pageCount = pages.length;
output.componentCount = components.length;

let placeholders = [];
let buttons = 0;
let inlineStyles = 0;
let dataTables = [];
let forms = [];
let dialogs = [];

allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('<Placeholder')) placeholders.push(f);
    const btnMatches = content.match(/<Button|<button/g);
    if (btnMatches) buttons += btnMatches.length;
    
    if (content.includes('style={{')) inlineStyles++;
    if (content.includes('<DataTable')) dataTables.push(f);
    if (content.includes('<form')) forms.push(f);
    if (content.includes('<Dialog') || content.includes('<SlideOver') || content.includes('<Modal')) dialogs.push(f);
});

console.log(JSON.stringify({
    pageCount: output.pageCount,
    componentCount: output.componentCount,
    placeholders: placeholders.map(p => path.basename(p)),
    buttons,
    inlineStyles,
    dataTables: dataTables.map(p => path.basename(p)),
    forms: forms.map(p => path.basename(p)),
    dialogs: dialogs.map(p => path.basename(p)),
    pagesList: pages.map(p => path.basename(p)),
    hooksList: hooks.map(p => path.basename(p))
}, null, 2));
