const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, organisation_id: true } });
  console.log('Users:', users);
  const projects = await prisma.project.findMany({
    include: {
      programme: {
        include: {
          unite: {
            include: {
              departement: {
                include: {
                  direction: true
                }
              }
            }
          }
        }
      }
    }
  });
  console.log('Projects:', projects.map(p => ({
    id: p.id,
    name: p.nom,
    org_id: p.programme?.unite?.departement?.direction?.organisation_id
  })));
}
main().finally(() => prisma.$disconnect());
