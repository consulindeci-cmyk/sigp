const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.project.deleteMany({ where: { programme_id: null } })
  .then(res => console.log('Deleted ghosts:', res.count))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
