const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src';
let anomaliesDetected = 0;
let anomaliesFixed = 0;
let modifiedFiles = new Set();

const skipFiles = ['ProjectHeader.tsx', 'DashboardPage.tsx', 'AppShell.tsx', 'index.css']; // These might have legitimate large fonts or specific overrides

function processFile(filePath) {
    const basename = path.basename(filePath);
    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;

    // 1. Cards (Rounded & Shadows)
    const roundedMatches = content.match(/rounded-(xl|2xl|3xl)/g);
    if (roundedMatches) {
        anomaliesDetected += roundedMatches.length;
        content = content.replace(/rounded-(xl|2xl|3xl)/g, 'rounded-lg');
    }

    const shadowMatches = content.match(/shadow-(md|lg|xl|2xl)/g);
    if (shadowMatches && basename !== 'Modal.tsx' && basename !== 'SlideOver.tsx') { // Modals can have large shadows
        anomaliesDetected += shadowMatches.length;
        content = content.replace(/shadow-(md|lg|xl|2xl)/g, 'shadow-sm');
    }

    // 2. Legacy colors
    const colorMatches1 = content.match(/text-navy/g);
    if (colorMatches1) {
        anomaliesDetected += colorMatches1.length;
        content = content.replace(/text-navy/g, 'text-primary');
    }
    const colorMatches2 = content.match(/bg-slate/g);
    if (colorMatches2) {
        anomaliesDetected += colorMatches2.length;
        content = content.replace(/bg-slate/g, 'bg-muted');
    }

    // 3. Typography
    if (!skipFiles.includes(basename)) {
        const text2xlMatches = content.match(/text-2xl/g);
        if (text2xlMatches) {
            anomaliesDetected += text2xlMatches.length;
            content = content.replace(/text-2xl/g, 'text-xl');
        }
    }

    // 4. Buttons (Only obvious ones that are just styled divs acting as buttons or simple tailwind native buttons)
    // We will do a generic standardisation of generic action buttons class:
    // This is risky to do fully regex, we'll fix the most obvious padding inconsistencies on buttons.
    const buttonPaddingMatches = content.match(/px-5 py-3/g);
    if (buttonPaddingMatches) {
        anomaliesDetected += buttonPaddingMatches.length;
        content = content.replace(/px-5 py-3/g, 'px-4 py-2'); // Standardize button padding
    }

    if (original !== content) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles.add(basename);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            walk(file);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            processFile(file);
        }
    });
}

walk(srcDir);

console.log(JSON.stringify({
    anomaliesDetected,
    anomaliesFixed: anomaliesDetected,
    modifiedCount: modifiedFiles.size,
    modifiedFiles: Array.from(modifiedFiles)
}, null, 2));
