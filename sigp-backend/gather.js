require('ts-node').register({ transpileOnly: true });
const { PrismaClient } = require('@prisma/client');
const { BudgetService } = require('./src/modules/budget/budget.service');
const { DashboardService } = require('./src/modules/dashboard/dashboard.service');
const { EvmService } = require('./src/modules/evm/evm.service');

async function run() {
  const prisma = new PrismaClient();
  const ds = new DashboardService(prisma, new EvmService(prisma));
  const bs = new BudgetService(prisma);

  const stats = {
    projetsCount: await prisma.projet.count(),
    projets: await prisma.projet.findMany({ select: { id: true, nom_projet: true, statut: true } }),
    lignesCount: await prisma.ligneBudgetaire.count(),
    tachesCount: await prisma.tache.count()
  };
  console.log('--- DB STATS ---');
  console.log(JSON.stringify(stats, null, 2));

  const p = stats.projets[0];
  if(p) {
    console.log('\n--- API PAYLOADS ---');
    console.log('DASHBOARD:', JSON.stringify(await ds.getGlobal(), null, 2));
    console.log('BUDGET SUMMARY:', JSON.stringify(await bs.getSummary(p.id), null, 2));
  }
  
  await prisma.$disconnect();
}
run();
