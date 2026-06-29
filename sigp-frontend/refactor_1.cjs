const fs = require('fs');

const headerPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src/components/project/layout/ProjectHeader.tsx';
let content = fs.readFileSync(headerPath, 'utf8');

content = content.replace(
    /import \{ Card, CardContent \} from '@\/components\/ui\/data-display\/Card';/g,
    "import { PageHeader } from '@/components/layout/PageHeader';"
);

const newHeader = 
  return (
    <PageHeader
      title="Électrification Rurale Phase II"
      badges={
        <>
          <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">PROJ-014</span>
          <Badge variant="warning">En retard</Badge>
          <Badge variant="destructive">Priorité: Critique</Badge>
        </>
      }
      actions={
        <Button 
          variant={isEditing ? "default" : "outline"} 
          onClick={() => setIsEditing(!isEditing)}
          className="flex-1 md:flex-none"
          leftIcon={isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        >
          {isEditing ? 'Terminer l\\'édition' : 'Éditer la coquille'}
        </Button>
      }
    />
  );
;

content = content.replace(/return \([\s\S]*?\);/, newHeader.trim());
fs.writeFileSync(headerPath, content, 'utf8');

// Replace KPICard with StatCard
const findReplaceInDir = (dir, fromRegex, toStr) => {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) findReplaceInDir(file, fromRegex, toStr);
        else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let data = fs.readFileSync(file, 'utf8');
            if (data.match(fromRegex)) {
                data = data.replace(fromRegex, toStr);
                fs.writeFileSync(file, data, 'utf8');
            }
        }
    });
};

findReplaceInDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src', /KPICard/g, 'StatCard');
findReplaceInDir('c:/Users/Baba Traore/Documents/mesApp/projet/sigp-frontend/src', /import \{ KPICard \}/g, 'import { StatCard }');
// StatCard doesn't have trendUp props like KPICard might, let's just do a blind replace and fix errors during tsc.

