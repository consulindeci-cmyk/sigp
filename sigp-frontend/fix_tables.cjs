const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacements) {
    if(!fs.existsSync(filePath)) return false;
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    for(const rep of replacements) {
        if(content.includes(rep.search) || (rep.regex && content.match(rep.search))) {
            if(rep.regex) content = content.replace(rep.search, rep.replace);
            else content = content.split(rep.search).join(rep.replace);
            modified = true;
        }
    }
    if(modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    return false;
}

// Fix native tables
const tableFiles = [
    'src/components/project/ptba/views/PTBAMatrix.tsx',
    'src/components/project/ppm/views/PPMMatrix.tsx',
    'src/components/project/budget/views/BudgetMatrix.tsx',
    'src/components/common/workflow/WorkflowLogTable.tsx'
];

let modifiedTables = [];

tableFiles.forEach(f => {
    const fullPath = path.join('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend', f);
    const success = replaceFile(fullPath, [
        { search: '<table className="w-full', replace: '<table className="w-full text-sm' },
        { search: 'overflow-auto', replace: 'overflow-x-auto scrollbar-thin' },
        { search: 'minWidth: \'1600px\'', replace: 'minWidth: "1200px"' }
    ]);
    if(success) modifiedTables.push(f);
});

// Fix double scroll
const ganttPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/components/project/ptba/views/PTBAGanttView.tsx';
const ganttSuccess = replaceFile(ganttPath, [
    { search: '<div className="overflow-auto h-full">\\n      <div className="min-w-[1200px]">', replace: '<div className="overflow-x-auto scrollbar-thin h-full">\\n      <div className="min-w-[1200px]">' },
    { search: '<div className="overflow-auto', replace: '<div className="overflow-x-auto scrollbar-thin' }
]);

console.log(JSON.stringify({ modifiedTables, ganttSuccess }));
