require('ts-node').register({ transpileOnly: true });
const { PrismaClient } = require('@prisma/client');
const { BudgetService } = require('./src/modules/budget/budget.service');
const { DashboardService } = require('./src/modules/dashboard/dashboard.service');
const { EvmService } = require('./src/modules/evm/evm.service');

async function run() {
  const prisma = new PrismaClient();
  const evm = new EvmService(prisma);
  const bs = new BudgetService(prisma);
  const ds = new DashboardService(prisma, evm);

  const p = await prisma.projet.findFirst({ where: { deletedAt: null, statut: 'ACTIF' } });
  if (!p) { console.log('No active project found.'); return; }
  
  console.log('--- DASHBOARD GLOBAL PAYLOAD ---');
  const dPayload = await ds.getGlobal();
  console.log(JSON.stringify(dPayload.financier, null, 2));

  console.log('\n--- BUDGET SUMMARY PAYLOAD ---');
  const sPayload = await bs.getSummary(p.id);
  console.log(JSON.stringify(sPayload, null, 2));

  console.log('\n--- BUDGET FINDALL PAYLOAD (1st item) ---');
  const aPayload = await bs.findAll(p.id);
  console.log(JSON.stringify(aPayload.data[0], null, 2));
  
  await prisma.$disconnect();
}
run();
