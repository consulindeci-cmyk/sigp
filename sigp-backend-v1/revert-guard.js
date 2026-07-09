const fs = require('fs');
const path = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.controller.ts';
let content = fs.readFileSync(path, 'utf8');

// The faulty replacement was:
// content.replace(/(@ApiAuth\([^)]*\)\s*\n\s*@ApiOperation)/g, '$1\n  @UseGuards(ProjectAccessGuard)');
// But the matched string was @ApiAuth(...) \n @ApiOperation, and it replaced it with @ApiAuth(...) \n @ApiOperation \n @UseGuards(ProjectAccessGuard)
// Wait! @ApiOperation({ ... }) is a function call.
// Ah, the problem was that @ApiOperation is NOT followed by a newline but by `({ summary: ... })` which I matched partially? No, I matched @ApiOperation literally, which means it inserted `@UseGuards(ProjectAccessGuard)` BETWEEN `@ApiOperation` and `({ summary: ... })`!!

// Let's remove all `@UseGuards(ProjectAccessGuard)` from the file
content = content.replace(/@UseGuards\(ProjectAccessGuard\)/g, '');

// And add it back to the class level:
content = content.replace("export class ProjectController {", "@UseGuards(ProjectAccessGuard)\nexport class ProjectController {");

fs.writeFileSync(path, content, 'utf8');
console.log('Reverted ProjectController guards');
