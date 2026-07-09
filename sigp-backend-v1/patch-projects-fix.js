const fs = require('fs');

const servicePath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.service.ts';
let sContent = fs.readFileSync(servicePath, 'utf8');

// fix imports
sContent = sContent.replace(
  "import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';",
  "import { ConflictException, NotFoundException } from '@/common/exceptions/business.exception';\nimport { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';\nimport { PrismaService } from '@/prisma/prisma.service';"
);

// fix constructor
sContent = sContent.replace(
  '    private readonly risqueRepository: RisqueRepository,\n    private readonly ptbaRepository: PtbaRepository,\n  ) {}',
  '    private readonly risqueRepository: RisqueRepository,\n    private readonly ptbaRepository: PtbaRepository,\n    private readonly prisma: PrismaService,\n  ) {}'
);

// fix project.controller.spec.ts error: src/projects/project.controller.spec.ts(48,37): error TS2554: Expected 2 arguments, but got 1.
const specPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.controller.spec.ts';
let specContent = fs.readFileSync(specPath, 'utf8');
specContent = specContent.replace(
  'projectController.findAll({ page: 1, limit: 10 } as any)',
  'projectController.findAll({ page: 1, limit: 10 } as any, { id: "1", role: "VIEWER" } as any)'
);
fs.writeFileSync(specPath, specContent, 'utf8');

fs.writeFileSync(servicePath, sContent, 'utf8');
console.log('Fixed project.service.ts imports and constructor, and spec');
