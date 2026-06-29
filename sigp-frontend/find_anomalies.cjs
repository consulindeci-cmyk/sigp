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
        } else if (file.endsWith(ext)) {
            results.push(file);
        }
    });
    return results;
}

const allFiles = getFiles(srcDir);
let anomalies = {
    rounded: [],
    shadow: [],
    text2xl: [],
    nativeButtons: [],
    doubleScroll: [],
    legacyColors: [],
    nativeTables: []
};

allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const basename = path.basename(f);
    
    // Cards anomalies
    if (content.match(/rounded-(xl|2xl|3xl|none|sm)/)) anomalies.rounded.push(basename);
    if (content.match(/shadow-(md|lg|xl|2xl|none)/)) anomalies.shadow.push(basename);
    
    // Typography
    if (content.match(/text-(2xl|3xl|4xl)/)) anomalies.text2xl.push(basename);
    
    // Buttons
    if (content.match(/<button/)) anomalies.nativeButtons.push(basename);
    
    // Tables
    if (content.match(/<table/)) anomalies.nativeTables.push(basename);

    // Colors
    if (content.match(/text-(navy|slate|gray)/) || content.match(/bg-(slate|gray)/)) anomalies.legacyColors.push(basename);

    // Scroll
    if (content.match(/overflow-(auto|scroll).*overflow-(auto|scroll)/s)) anomalies.doubleScroll.push(basename);
});

console.log(JSON.stringify(anomalies, null, 2));
