const fs = require('fs');

const controllerSpec = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/dashboard/dashboard.controller.spec.ts';
let cSpec = fs.readFileSync(controllerSpec, 'utf8');
cSpec = cSpec.replace(/getDashboard\(\)/g, 'getDashboard({ id: "1", role: "VIEWER", email: "test@test.com" } as any)');
fs.writeFileSync(controllerSpec, cSpec, 'utf8');

const serviceSpec = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/dashboard/dashboard.service.spec.ts';
let sSpec = fs.readFileSync(serviceSpec, 'utf8');
sSpec = sSpec.replace(/getDashboard\(\)/g, 'getDashboard("1", "VIEWER")');
fs.writeFileSync(serviceSpec, sSpec, 'utf8');

console.log('Fixed specs');
