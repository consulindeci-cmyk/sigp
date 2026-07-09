const fs = require('fs');

const path = 'c:/Users/Baba Traore/Documents/mesApp/projet/sigp-backend-v1/src/dashboard/dashboard.service.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Signature
content = content.replace(
  'async getDashboard(): Promise<DashboardResponseDto> {',
  'async getDashboard(organisationId?: string): Promise<DashboardResponseDto> {'
);

// 2. Pagination objects
content = content.replace(
  'const page1 = { page: 1, limit: 1 };',
  'const page1 = { page: 1, limit: 1, organisationId };'
);
content = content.replace(
  'const page1L100 = { page: 1, limit: 100 };',
  'const page1L100 = { page: 1, limit: 100, organisationId };'
);

// 3. Orgnisation Filter helper
const orgFilterStr = `
    const orgFilter = organisationId
      ? { programme: { unite: { departement: { direction: { organisation_id: organisationId } } } } }
      : {};
    const orgFilterProject = organisationId
      ? { project: { programme: { unite: { departement: { direction: { organisation_id: organisationId } } } } } }
      : {};
    const orgFilterVersionProject = organisationId
      ? { version: { project: { programme: { unite: { departement: { direction: { organisation_id: organisationId } } } } } } }
      : {};
`;
content = content.replace(
  'const since12M = new Date(now.getFullYear(), now.getMonth() - 11, 1);',
  'const since12M = new Date(now.getFullYear(), now.getMonth() - 11, 1);\n' + orgFilterStr
);

// 4. BudgetLigne aggregate
content = content.replace(
  'this.prisma.budgetLigne.aggregate({\n        where: { deleted_at: null },',
  'this.prisma.budgetLigne.aggregate({\n        where: { deleted_at: null, ...orgFilterVersionProject },'
);

// 5. Disbursements
content = content.replace(
  'this.prisma.disbursement.findMany({\n        where: {\n          OR: [{ date_reelle: { gte: since12M } }, { date_prevue: { gte: since12M } }],\n        },',
  'this.prisma.disbursement.findMany({\n        where: {\n          ...orgFilterProject,\n          OR: [{ date_reelle: { gte: since12M } }, { date_prevue: { gte: since12M } }],\n        },'
);

// 6. Budget lignes findMany
content = content.replace(
  'this.prisma.budgetLigne.findMany({\n        select: { categorie: true, montant_prevu: true },\n      }),',
  'this.prisma.budgetLigne.findMany({\n        where: { deleted_at: null, ...orgFilterVersionProject },\n        select: { categorie: true, montant_prevu: true },\n      }),'
);

// 7. Funding Source
content = content.replace(
  'this.prisma.fundingSource.findMany({\n        select: { nom: true, montant: true },',
  'this.prisma.fundingSource.findMany({\n        where: { ...orgFilterProject },\n        select: { nom: true, montant: true },'
);

// 8. PtbaActivite (Activités critiques)
content = content.replace(
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          OR: [\n            { statut: PtbaStatut.EN_RETARD },',
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          ...orgFilterProject,\n          OR: [\n            { statut: PtbaStatut.EN_RETARD },'
);

// 9. Risque
content = content.replace(
  'this.prisma.risque.findMany({\n        where: {\n          niveau_criticite: { in: [\'CRITIQUE\', \'ELEVE\', \'MODERE\'] },\n        },',
  'this.prisma.risque.findMany({\n        where: {\n          ...orgFilterProject,\n          niveau_criticite: { in: [\'CRITIQUE\', \'ELEVE\', \'MODERE\'] },\n        },'
);

// 10. Jalons
content = content.replace(
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n          date_fin_prevue: { gte: now },\n        },',
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          ...orgFilterProject,\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n          date_fin_prevue: { gte: now },\n        },'
);

// 11. Echeances proches
content = content.replace(
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n          date_fin_prevue: { gte: now },\n        },\n        select: {',
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          ...orgFilterProject,\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n          date_fin_prevue: { gte: now },\n        },\n        select: {'
);

// 12. Notifications
content = content.replace(
  'this.prisma.notification.findMany({\n        select: { id: true, titre: true, message: true, type: true, created_at: true },',
  'this.prisma.notification.findMany({\n        where: { ...orgFilterProject },\n        select: { id: true, titre: true, message: true, type: true, created_at: true },'
);

// 13. Timeline - Activites
content = content.replace(
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          date_fin_prevue: { gte: now },\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n        },',
  'this.prisma.ptbaActivite.findMany({\n        where: {\n          ...orgFilterProject,\n          date_fin_prevue: { gte: now },\n          statut: { notIn: [PtbaStatut.TERMINE, PtbaStatut.ANNULE] },\n        },'
);

// 14. Timeline - Contracts
content = content.replace(
  'this.prisma.contract.findMany({\n        where: {\n          date_fin: { gte: now },\n        },',
  'this.prisma.contract.findMany({\n        where: {\n          ...orgFilterProject,\n          date_fin: { gte: now },\n        },'
);

// 15. EvmSnapshot
content = content.replace(
  'this.prisma.evmSnapshot.findMany({\n        select: { periode: true, pv: true, ev: true, ac: true },',
  'this.prisma.evmSnapshot.findMany({\n        where: { ...orgFilterProject },\n        select: { periode: true, pv: true, ev: true, ac: true },'
);

// 16. Project aggregation (The most critical one)
content = content.replace(
  'this.prisma.project.aggregate({\n        _sum: { budget_total: true },\n      }),',
  'this.prisma.project.aggregate({\n        where: { deleted_at: null, ...orgFilter },\n        _sum: { budget_total: true },\n      }),'
);

fs.writeFileSync(path, content, 'utf8');
console.log('dashboard.service.ts replaced successfully!');
