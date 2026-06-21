import { PrismaClient, Role, StatutProjet, NiveauIntervention, StatutPTBA, StatutTache, TypeMarche, MethodePassation, TypeRevue, StatutMarche, StatutRisque } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');
  
  // 1. Création des utilisateurs de test
  const saltRounds = 12;
  const passwords = {
    SUPER_ADMIN: await bcrypt.hash('Admin@2026', saltRounds),
    COORDONNATEUR: await bcrypt.hash('Coord@2026', saltRounds),
    RESP_FINANCIER: await bcrypt.hash('Finance@2026', saltRounds),
    BAILLEUR: await bcrypt.hash('Bailleur@2026', saltRounds),
    AUDITEUR: await bcrypt.hash('Audit@2026', saltRounds),
  };

  const users = await Promise.all([
    prisma.utilisateur.upsert({
      where: { email: 'admin@sigp.ci' },
      update: {},
      create: { prenom: 'Super', nom: 'Admin', email: 'admin@sigp.ci', mot_de_passe: passwords.SUPER_ADMIN, role: Role.SUPER_ADMIN },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'coord@sigp.ci' },
      update: {},
      create: { prenom: 'Coordo', nom: 'Projet', email: 'coord@sigp.ci', mot_de_passe: passwords.COORDONNATEUR, role: Role.COORDONNATEUR_PROJET },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'finance@sigp.ci' },
      update: {},
      create: { prenom: 'Resp', nom: 'Finance', email: 'finance@sigp.ci', mot_de_passe: passwords.RESP_FINANCIER, role: Role.RESPONSABLE_FINANCIER },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'bailleur@banquemonde.org' },
      update: {},
      create: { prenom: 'Rep', nom: 'Bailleur', email: 'bailleur@banquemonde.org', mot_de_passe: passwords.BAILLEUR, role: Role.BAILLEUR },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'audit@sigp.ci' },
      update: {},
      create: { prenom: 'Expert', nom: 'Audit', email: 'audit@sigp.ci', mot_de_passe: passwords.AUDITEUR, role: Role.AUDITEUR },
    }),
  ]);

  console.log('Users created:', users.map(u => u.email));

  // 2. Création du projet de démonstration
  const existingProject = await prisma.projet.findUnique({ where: { code_projet: 'P001' } });
  if (existingProject) {
    console.log('Seed already completed (project P001 exists). Skipping further seeding to prevent duplicates.');
    return;
  }

  const projet = await prisma.projet.create({
    data: {
      code_projet: 'P001',
      nom_projet: 'Projet d\'Accès à l\'Eau Potable en Milieu Rural — Côte d\'Ivoire',
      description: 'Amélioration de l\'accès à l\'eau potable dans les régions nord',
      bailleur_principal: 'Banque Mondiale',
      date_debut: new Date('2025-01-01'),
      date_fin: new Date('2027-12-31'),
      budget_total: 2500000.00,
      devise: 'XOF',
      statut: StatutProjet.ACTIF,
    },
  });

  console.log('Project created:', projet.code_projet);

  // 3. Cadre Logique
  const logframesData = [
    { niveau: NiveauIntervention.IMPACT, ind: 'Taux de morbidité liée à l\'eau', cible: 'Baisse de 30%' },
    { niveau: NiveauIntervention.EFFET, ind: 'Taux d\'accès à l\'eau potable', cible: '75%' },
    { niveau: NiveauIntervention.RESULTAT, ind: 'Forages fonctionnels', cible: '50 forages' },
    { niveau: NiveauIntervention.ACTIVITE, ind: 'Forages construits', cible: '50 forages' },
  ];
  for (const lf of logframesData) {
    await prisma.cadreLogique.create({
      data: {
        projet_id: projet.id,
        niveau_intervention: lf.niveau,
        indicateur: lf.ind,
        cible: lf.cible,
      }
    });
  }

  // 4. Sources de financement
  await prisma.sourceFinancement.createMany({
    data: [
      { projet_id: projet.id, nom_bailleur: 'Banque Mondiale', montant: 2000000, devise: 'XOF' },
      { projet_id: projet.id, nom_bailleur: 'Contrepartie État CI', montant: 500000, devise: 'XOF' },
    ]
  });

  // 5. WBS
  const wbsData = [
    { code: 'WBS-01', nom: 'Infrastructures' },
    { code: 'WBS-02', nom: 'Formation et Sensibilisation' },
    { code: 'WBS-03', nom: 'Suivi-Évaluation' },
  ];
  const wbsList = [];
  for (const w of wbsData) {
    const wbs = await prisma.wBS.create({
      data: { projet_id: projet.id, code_wbs: w.code, nom_phase: w.nom }
    });
    wbsList.push(wbs);
  }

  // 6. Lignes Budgétaires
  const budgetData = [
    { code: 'L1', rub: 'Pompes solaires', qte: 50, cu: 15000 },
    { code: 'L2', rub: 'Forage', qte: 50, cu: 25000 },
    { code: 'L3', rub: 'Formation COGES', qte: 10, cu: 5000 },
    { code: 'L4', rub: 'Audit Financier', qte: 1, cu: 10000 },
    { code: 'L5', rub: 'Véhicules 4x4', qte: 2, cu: 20000 },
  ];
  const budgetList = [];
  for (const b of budgetData) {
    const bg = await prisma.ligneBudgetaire.create({
      data: {
        projet_id: projet.id,
        code_budget: b.code,
        rubrique: b.rub,
        quantite: b.qte,
        cout_unitaire: b.cu,
        cout_total: b.qte * b.cu
      }
    });
    budgetList.push(bg);
  }

  // 7. PTBA
  for (let i = 1; i <= 4; i++) {
    await prisma.pTBA.create({
      data: {
        projet_id: projet.id,
        code_activite: `ACT-T${i}`,
        composante: 'Infrastructures',
        activite: `Forages Trimestre ${i}`,
        budget_prevu: 250000,
        [`q${i}`]: 250000,
        statut: i === 1 ? StatutPTBA.TERMINE : StatutPTBA.PLANIFIE
      }
    });
  }

  // 8. Tâches
  const tasksData = [
    { c: 'T01', d: 'Études géo', w: wbsList[0].id, b: budgetList[0].id, cp: 50000, cr: 50000, av: 100, s: StatutTache.TERMINE },
    { c: 'T02', d: 'Construction', w: wbsList[0].id, b: budgetList[1].id, cp: 200000, cr: 100000, av: 50, s: StatutTache.EN_COURS },
    { c: 'T03', d: 'Formation', w: wbsList[1].id, b: budgetList[2].id, cp: 50000, cr: 0, av: 0, s: StatutTache.A_FAIRE },
    { c: 'T04', d: 'Audit M1', w: wbsList[2].id, b: budgetList[3].id, cp: 10000, cr: 10000, av: 100, s: StatutTache.TERMINE },
    { c: 'T05', d: 'Achats Auto', w: wbsList[2].id, b: budgetList[4].id, cp: 40000, cr: 40000, av: 100, s: StatutTache.TERMINE },
  ];
  for (let i = 0; i < 5; i++) {
     tasksData.push({
       c: `T0${i+6}`, d: `Tâche ${i+6}`, w: wbsList[0].id, b: budgetList[1].id, cp: 20000, cr: 0, av: 0, s: StatutTache.A_FAIRE
     });
  }
  const createdTasks = [];
  for (const t of tasksData) {
    const task = await prisma.tache.create({
      data: {
        projet_id: projet.id, wbs_id: t.w, ligne_budgetaire_id: t.b, code_tache: t.c,
        description: t.d, cout_prevu: t.cp, cout_reel: t.cr, avancement: t.av, statut: t.s,
        date_debut: new Date('2025-01-10'), date_fin: new Date('2025-06-30')
      }
    });
    createdTasks.push(task);
  }

  // 9. Operations
  for (let i = 0; i < 10; i++) {
    const task = createdTasks[i % 5];
    await prisma.operation.create({
      data: {
        projet_id: projet.id,
        tache_id: task.id,
        date_operation: new Date(),
        statut: task.statut,
        montant_engage: task.cout_prevu,
        montant_decaisse: i < 3 ? task.cout_reel : 0,
        cree_par: users[0].id,
      }
    });
  }

  // 10. Marchés
  const marchesData = [
    { tm: TypeMarche.TRAVAUX, mp: MethodePassation.AOI },
    { tm: TypeMarche.TRAVAUX, mp: MethodePassation.AON },
    { tm: TypeMarche.CONSULTANTS, mp: MethodePassation.SFQC },
    { tm: TypeMarche.FOURNITURES, mp: MethodePassation.DEMANDE_COTATION },
    { tm: TypeMarche.FOURNITURES, mp: MethodePassation.GRE_A_GRE },
  ];
  for (let i = 0; i < marchesData.length; i++) {
    await prisma.marche.create({
      data: {
        projet_id: projet.id,
        description_marche: `Marché de ${marchesData[i].tm.toLowerCase()} ${i+1}`,
        type_marche: marchesData[i].tm,
        methode: marchesData[i].mp,
        type_revue: TypeRevue.A_POSTERIORI,
        montant_estime: 150000,
        statut: StatutMarche.PLANIFIE
      }
    });
  }

  // 11. Risques
  const risquesData = [
    { cat: 'Technique', p: 3, i: 3, c: 9, s: StatutRisque.IDENTIFIE },
    { cat: 'Financier', p: 2, i: 3, c: 6, s: StatutRisque.EN_COURS_ATTENUATION },
    { cat: 'Social', p: 2, i: 2, c: 4, s: StatutRisque.CLOS },
    { cat: 'Environnemental', p: 1, i: 2, c: 2, s: StatutRisque.IDENTIFIE },
  ];
  for (const r of risquesData) {
    await prisma.risque.create({
      data: {
        projet_id: projet.id, categorie: r.cat, description: `Risque ${r.cat}`,
        probabilite: r.p, impact: r.i, criticite: r.c, statut: r.s
      }
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
