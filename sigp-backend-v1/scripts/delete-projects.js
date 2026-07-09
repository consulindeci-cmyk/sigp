const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.project.deleteMany();
  console.log("All projects deleted.");
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
