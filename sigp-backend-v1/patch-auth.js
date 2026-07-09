const fs = require('fs');
const path = require('path');

const controllerPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/dashboard/dashboard.controller.ts';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

controllerContent = controllerContent.replace(
  'getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<DashboardResponseDto> {\n    const orgId = user.role !== UserRole.ADMIN ? user.organisationId : undefined;\n    return this.dashboardService.getDashboard(orgId);\n  }',
  'getDashboard(@CurrentUser() user: AuthenticatedUser): Promise<DashboardResponseDto> {\n    return this.dashboardService.getDashboard(user.id, user.role);\n  }'
);

fs.writeFileSync(controllerPath, controllerContent, 'utf8');

const servicePath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/dashboard/dashboard.service.ts';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

serviceContent = serviceContent.replace(
  'async getDashboard(organisationId?: string): Promise<DashboardResponseDto> {\n    const now = new Date();',
  'async getDashboard(userId: string, userRole: string): Promise<DashboardResponseDto> {\n    let organisationId;\n    if (userRole !== "ADMIN") {\n      const dbUser = await this.prisma.user.findUnique({ where: { id: userId }, select: { organisation_id: true } });\n      organisationId = dbUser?.organisation_id || undefined;\n    }\n    const now = new Date();'
);

fs.writeFileSync(servicePath, serviceContent, 'utf8');
console.log('Fixed auth params successfully!');
