const fs = require('fs');
const path = require('path');

function replaceInDir(dir, searchRegex, replaceStr) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            replaceInDir(file, searchRegex, replaceStr);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let data = fs.readFileSync(file, 'utf8');
            if (data.match(searchRegex)) {
                data = data.replace(searchRegex, replaceStr);
                fs.writeFileSync(file, data, 'utf8');
                console.log('Modified: ' + file);
            }
        }
    });
}

// 1. KPICard -> StatCard
replaceInDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src', /KPICard/g, 'StatCard');
replaceInDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src', /import \{ StatCard \} from '.*?KPICard';/g, "import { StatCard } from '@/components/ui/data-display/StatCard';");

// 2. data-display/DataTable -> data-table/DataTable
replaceInDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src', /ui\/data-display\/DataTable/g, 'ui/data-table/DataTable');

// Delete the old files
try { fs.unlinkSync('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/components/shared/KPICard.tsx'); } catch(e) {}
try { fs.unlinkSync('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/components/ui/data-display/DataTable.tsx'); } catch(e) {}

// 3. Fix ProjectForm.tsx
const formPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/pages/ProjectForm.tsx';
if (fs.existsSync(formPath)) {
    let formContent = fs.readFileSync(formPath, 'utf8');
    // Replace big H1 with PageHeader
    formContent = formContent.replace(/<h1 className="text-3xl font-bold text-slate-900 mb-8">/, '<PageHeader title="');
    formContent = formContent.replace(/Nouveau Projet<\/h1>/, 'Nouveau Projet" />');
    formContent = formContent.replace(/import React, \{ useState \} from 'react';/, "import React, { useState } from 'react';\nimport { PageHeader } from '@/components/layout/PageHeader';");
    // Add centering and gap to main container
    formContent = formContent.replace(/<div className="container mx-auto p-8 max-w-5xl">/, '<div className="container mx-auto p-6 md:p-8 max-w-4xl space-y-6">');
    formContent = formContent.replace(/<div className="flex gap-4">/, '<div className="flex flex-wrap gap-4 mb-6">');
    fs.writeFileSync(formPath, formContent, 'utf8');
}

