const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.utilisateur.findMany();
  console.log('All users:');
  users.forEach(u => console.log(u.email, u.role, u.actif));
}

main().finally(() => prisma.$disconnect());
