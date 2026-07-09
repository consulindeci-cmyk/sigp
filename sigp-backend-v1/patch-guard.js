const fs = require('fs');
const path = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.controller.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove from class level
content = content.replace('@UseGuards(ProjectAccessGuard)\nexport class ProjectController', 'export class ProjectController');

// I will add @UseGuards(ProjectAccessGuard) to EVERY method that has @ApiAuth
// Since we have multiple methods, we can do a regex replace
content = content.replace(/(@ApiAuth\([^)]*\)\s*\n\s*@ApiOperation)/g, '$1\n  @UseGuards(ProjectAccessGuard)');

fs.writeFileSync(path, content, 'utf8');
console.log('Patched ProjectController guards');
