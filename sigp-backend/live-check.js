const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const projets = await p.projet.findMany({
    select: { id: true, nom_projet: true, statut: true, budget_total: true }
  });
  const lignes = await p.ligneBudgetaire.count();
  const taches = await p.tache.count();
  console.log('=== DOCKER DB LIVE CHECK ===');
  console.log(JSON.stringify({ projets, lignes, taches }, null, 2));
  await p.$disconnect();
}

run();
