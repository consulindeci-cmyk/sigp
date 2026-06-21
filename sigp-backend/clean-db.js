require('ts-node').register({ transpileOnly: true });
const { PrismaClient, StatutProjet, StatutTache } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndSeed() {
  console.log('--- DELETING ALL DATA ---');
  // Delete all data in correct order to respect foreign keys
  await prisma.risque.deleteMany();
  await prisma.marche.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.wbs.deleteMany();
  await prisma.ligneBudgetaire.deleteMany();
  await prisma.activitePTBA.deleteMany();
  await prisma.indicateur.deleteMany();
  await prisma.resultat.deleteMany();
  await prisma.objectifSpecifique.deleteMany();
  await prisma.cadreLogique.deleteMany();
  await prisma.projet.deleteMany();
  
  console.log('--- CREATING REAL PROJECT ---');
  const projet = await prisma.projet.create({
    data: {
      code_projet: 'PAEPMR-CI',
      nom_projet: "Projet d'Accès à l'Eau Potable en Milieu Rural — Côte d'Ivoire",
      description: "Amélioration de l'accès à l'eau potable dans les zones rurales",
      budget_total: 4200000,
      devise: 'XOF',
      statut: StatutProjet.ACTIF,
    }
  });

  console.log('--- CREATING BUDGET LINES ---');
  const lignes = [
    { rubrique: 'Forage', quantite: 1, cout_unitaire: 2500000 },
    { rubrique: 'Pompes solaires', quantite: 1, cout_unitaire: 1500000 },
    { rubrique: 'Formation COGES', quantite: 1, cout_unitaire: 100000 },
    { rubrique: 'Audit Financier', quantite: 1, cout_unitaire: 100000 }
  ];

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    const cout_total = l.quantite * l.cout_unitaire;
    
    const ligne = await prisma.ligneBudgetaire.create({
      data: {
        projet_id: projet.id,
        code_budget: `L0${i+1}`,
        rubrique: l.rubrique,
        quantite: l.quantite,
        cout_unitaire: l.cout_unitaire,
        cout_total: cout_total
      }
    });

    // Create a task for some lines to show engaged/decaisse
    if (l.rubrique === 'Forage') {
      await prisma.tache.create({
        data: {
          projet_id: projet.id,
          ligne_budgetaire_id: ligne.id,
          code_tache: 'T-FOR',
          description: 'Réalisation du forage',
          cout_prevu: 1000000,
          cout_reel: 500000,
          avancement: 50,
          statut: StatutTache.EN_COURS
        }
      });
    }

    if (l.rubrique === 'Audit Financier') {
      await prisma.tache.create({
        data: {
          projet_id: projet.id,
          ligne_budgetaire_id: ligne.id,
          code_tache: 'T-AUD',
          description: 'Audit initial',
          cout_prevu: 100000,
          cout_reel: 100000,
          avancement: 100,
          statut: StatutTache.TERMINE
        }
      });
    }
  }

  console.log('--- SEEDING COMPLETED SUCESSFULLY ---');
  await prisma.$disconnect();
}

cleanAndSeed().catch(e => {
  console.error(e);
  process.exit(1);
});
