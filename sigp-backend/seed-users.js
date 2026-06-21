const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Création des comptes de test (Seed)...');
  
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
      create: { prenom: 'Super', nom: 'Administrateur', email: 'admin@sigp.ci', mot_de_passe: passwords.SUPER_ADMIN, role: 'SUPER_ADMIN' },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'coord@sigp.ci' },
      update: {},
      create: { prenom: 'Coordonnateur', nom: 'Projet', email: 'coord@sigp.ci', mot_de_passe: passwords.COORDONNATEUR, role: 'COORDONNATEUR_PROJET' },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'finance@sigp.ci' },
      update: {},
      create: { prenom: 'Responsable', nom: 'Financier', email: 'finance@sigp.ci', mot_de_passe: passwords.RESP_FINANCIER, role: 'RESPONSABLE_FINANCIER' },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'bailleur@banquemonde.org' },
      update: {},
      create: { prenom: 'Représentant', nom: 'Bailleur', email: 'bailleur@banquemonde.org', mot_de_passe: passwords.BAILLEUR, role: 'BAILLEUR' },
    }),
    prisma.utilisateur.upsert({
      where: { email: 'audit@sigp.ci' },
      update: {},
      create: { prenom: 'Expert', nom: 'Auditeur', email: 'audit@sigp.ci', mot_de_passe: passwords.AUDITEUR, role: 'AUDITEUR' },
    }),
  ]);

  console.log('Comptes créés avec succès :');
  users.forEach(u => console.log(`- ${u.role} : ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
