const fs = require('fs');

// Fix controller spec
const cSpecPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.controller.spec.ts';
let cSpec = fs.readFileSync(cSpecPath, 'utf8');
// replace any `findAll({` with `findAll({ ... } as any, { id: '1', role: 'VIEWER' } as any)`
// Since it's a test file, we can just replace the exact method call.
cSpec = cSpec.replace(
  'await projectController.findAll(query)',
  'await projectController.findAll(query, { id: "1", role: "VIEWER" } as any)'
);
fs.writeFileSync(cSpecPath, cSpec, 'utf8');

// Fix service spec
const sSpecPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.service.spec.ts';
let sSpec = fs.readFileSync(sSpecPath, 'utf8');
sSpec = sSpec.replace(
  'mocks.risqueRepository,\n      mocks.ptbaRepository,\n    );',
  'mocks.risqueRepository,\n      mocks.ptbaRepository,\n      mocks.prismaService as any,\n    );'
);
if (!sSpec.includes('mocks.prismaService')) {
  sSpec = sSpec.replace(
    'mocks.risqueRepository,\n      mocks.ptbaRepository\n    );',
    'mocks.risqueRepository,\n      mocks.ptbaRepository,\n      { user: { findUnique: jest.fn() } } as any\n    );'
  );
}

fs.writeFileSync(sSpecPath, sSpec, 'utf8');
console.log('Fixed final specs');
