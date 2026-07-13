import {
  PrismaClient,
  UserRole,
  OrganisationType,
  ProgrammeStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

// ─── Config ───────────────────────────────────────────────────────────────────

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@sigp.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@2024!';
const ADMIN_NOM      = 'Admin';
const ADMIN_PRENOM   = 'SIGP';

const ORG_CODE   = 'SIGP-ORG';
const ORG_NOM    = 'Organisation SIGP';
const DIR_CODE   = 'DIR-GEN';
const DIR_NOM    = 'Direction Générale';
const DEPT_CODE  = 'DEPT-OP';
const DEPT_NOM   = 'Département Opérations';
const UNITE_CODE = 'UNIT-GP';
const UNITE_NOM  = 'Unité Gestion de Projets';
const PROG_CODE  = 'PROG-GP';
const PROG_NOM   = 'Programme Gestion de Projets';

// ─── Client ───────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function separator() {
  console.log('─'.repeat(60));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log('  SIGP — Seed initial (données minimales)');
  separator();

  // ── 1. Organisation ──────────────────────────────────────────────────────────

  let org = await prisma.organisation.findFirst({
    where: { code: ORG_CODE },
  });

  if (!org) {
    org = await prisma.organisation.create({
      data: {
        code:        ORG_CODE,
        nom:         ORG_NOM,
        type:        OrganisationType.INSTITUTION,
        description: 'Organisation principale du système SIGP',
        actif:       true,
      },
    });
    console.log(`✔  Organisation créée  : ${org.nom} (${org.id})`);
  } else {
    console.log(`⟳  Organisation existe : ${org.nom} (${org.id})`);
  }

  // ── 2. Direction ─────────────────────────────────────────────────────────────

  let direction = await prisma.direction.findFirst({
    where: { organisation_id: org.id, code: DIR_CODE },
  });

  if (!direction) {
    direction = await prisma.direction.create({
      data: {
        organisation_id: org.id,
        code:            DIR_CODE,
        nom:             DIR_NOM,
        description:     'Direction générale de la gestion des projets',
        actif:           true,
      },
    });
    console.log(`✔  Direction créée     : ${direction.nom} (${direction.id})`);
  } else {
    console.log(`⟳  Direction existe    : ${direction.nom} (${direction.id})`);
  }

  // ── 3. Département ───────────────────────────────────────────────────────────

  let departement = await prisma.departement.findFirst({
    where: { direction_id: direction.id, code: DEPT_CODE },
  });

  if (!departement) {
    departement = await prisma.departement.create({
      data: {
        direction_id: direction.id,
        code:         DEPT_CODE,
        nom:          DEPT_NOM,
        description:  'Département en charge des opérations terrain',
        actif:        true,
      },
    });
    console.log(`✔  Département créé    : ${departement.nom} (${departement.id})`);
  } else {
    console.log(`⟳  Département existe  : ${departement.nom} (${departement.id})`);
  }

  // ── 4. Unité ─────────────────────────────────────────────────────────────────

  let unite = await prisma.unite.findFirst({
    where: { departement_id: departement.id, code: UNITE_CODE },
  });

  if (!unite) {
    unite = await prisma.unite.create({
      data: {
        departement_id: departement.id,
        code:           UNITE_CODE,
        nom:            UNITE_NOM,
        description:    'Unité dédiée à la gestion et au suivi des projets',
        actif:          true,
      },
    });
    console.log(`✔  Unité créée         : ${unite.nom} (${unite.id})`);
  } else {
    console.log(`⟳  Unité existe        : ${unite.nom} (${unite.id})`);
  }

  // ── 5. Programme ─────────────────────────────────────────────────────────────

  let programme = await prisma.programme.findFirst({
    where: { unite_id: unite.id, code: PROG_CODE },
  });

  if (!programme) {
    programme = await prisma.programme.create({
      data: {
        unite_id:    unite.id,
        code:        PROG_CODE,
        nom:         PROG_NOM,
        description: 'Programme principal pour la gestion et le suivi des projets',
        statut:      ProgrammeStatus.EN_COURS,
        actif:       true,
      },
    });
    console.log(`✔  Programme créé      : ${programme.nom} (${programme.id})`);
  } else {
    console.log(`⟳  Programme existe    : ${programme.nom} (${programme.id})`);
  }

  // ── 6. Utilisateurs (Administrateur + Utilisateurs de démo Frontend) ────────

  const demoUsers = [
    { email: ADMIN_EMAIL,                password: ADMIN_PASSWORD,  role: UserRole.ADMIN,        nom: ADMIN_NOM,       prenom: ADMIN_PRENOM },
    { email: 'admin@sigp.ci',            password: 'Admin@2026',    role: UserRole.ADMIN,        nom: 'Admin',         prenom: 'Super' },
    { email: 'coord@sigp.ci',            password: 'Coord@2026',    role: UserRole.COORDINATEUR, nom: 'Coordonnateur', prenom: 'SIGP' },
    { email: 'finance@sigp.ci',          password: 'Finance@2026',  role: UserRole.FINANCIER,    nom: 'Financier',     prenom: 'SIGP' },
    { email: 'bailleur@banquemonde.org', password: 'Bailleur@2026', role: UserRole.VIEWER,       nom: 'Bailleur',      prenom: 'Banque Mondiale' },
    { email: 'audit@sigp.ci',            password: 'Audit@2026',    role: UserRole.AUDITEUR,     nom: 'Auditeur',      prenom: 'SIGP' },
  ];

  for (const u of demoUsers) {
    let user = await prisma.user.findFirst({ where: { email: u.email } });
    const motDePasseHash = await argon2.hash(u.password);

    if (!user) {
      user = await prisma.user.create({
        data: {
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          mot_de_passe: motDePasseHash,
          role: u.role,
          actif: true,
          langue_preference: 'fr',
        },
      });
      console.log(`✔  Utilisateur créé    : ${user.prenom} ${user.nom} (${u.email}) [Rôle: ${user.role}]`);
    } else {
      // Met à jour le mot de passe pour être sûr qu'il correspond
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          mot_de_passe: motDePasseHash,
          role: u.role,
          actif: true,
        },
      });
      console.log(`⟳  Utilisateur mis à jour : ${user.prenom} ${user.nom} (${u.email}) [Rôle: ${user.role}]`);
    }
  }

  // ── Résumé ───────────────────────────────────────────────────────────────────

  separator();
  console.log('  COMPTES UTILISATEURS DU SYSTÈME');
  separator();
  for (const u of demoUsers) {
    console.log(`  - ${u.email.padEnd(26)} | MDP: ${u.password.padEnd(14)} | Rôle: ${u.role}`);
  }
  separator();
  console.log('  PROGRAMME (pour créer des projets)');
  separator();
  console.log(`  Programme ID : ${programme.id}`);
  separator();
}

main()
  .catch((e) => {
    console.error('Seed échoué :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
