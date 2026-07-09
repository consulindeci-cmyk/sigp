const fs = require('fs');

const controllerPath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.controller.ts';
let cContent = fs.readFileSync(controllerPath, 'utf8');

cContent = cContent.replace(
  'async findAll(@Query() query: ProjectQueryDto): Promise<ProjectListResponseDto> {\n    return this.projectService.findAll(query);\n  }',
  'async findAll(@Query() query: ProjectQueryDto, @CurrentUser() user: AuthenticatedUser): Promise<ProjectListResponseDto> {\n    return this.projectService.findAll(query, user);\n  }'
);

fs.writeFileSync(controllerPath, cContent, 'utf8');

const servicePath = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/projects/project.service.ts';
let sContent = fs.readFileSync(servicePath, 'utf8');

if (!sContent.includes('AuthenticatedUser')) {
  sContent = sContent.replace(
    "import { ActorContext } from './interfaces/actor-context.interface';", // wait, let's find a safe place to import
    "import { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';\nimport { ActorContext } from './interfaces/actor-context.interface';"
  );
  // fallback if not found
  if (sContent === fs.readFileSync(servicePath, 'utf8')) {
    sContent = sContent.replace(
      "import { PrismaService } from '@/prisma/prisma.service';",
      "import { PrismaService } from '@/prisma/prisma.service';\nimport { AuthenticatedUser } from '@/auth/interfaces/user-request.interface';"
    );
  }
}

sContent = sContent.replace(
  'async findAll(query: ProjectQueryDto): Promise<PaginatedResult<ProjectResponseDto>> {\n    const { skip, take } = paginationToSkipTake(query);',
  'async findAll(query: ProjectQueryDto, user?: AuthenticatedUser): Promise<PaginatedResult<ProjectResponseDto>> {\n    if (user && user.role !== "ADMIN") {\n      const dbUser = await this.prisma.user.findUnique({ where: { id: user.id }, select: { organisation_id: true } });\n      query.organisationId = dbUser?.organisation_id || undefined;\n    }\n    const { skip, take } = paginationToSkipTake(query);'
);

fs.writeFileSync(servicePath, sContent, 'utf8');
console.log('Project controller and service patched successfully');
