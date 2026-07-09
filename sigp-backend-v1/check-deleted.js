const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, nom: true, deleted_at: true, statut: true, manager_id: true }
  });
  console.log('Projects in DB:', projects);
}
main().finally(() => prisma.$disconnect());
