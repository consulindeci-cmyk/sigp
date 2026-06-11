-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN_PROJET', 'COORDONNATEUR_PROJET', 'RESPONSABLE_TECHNIQUE', 'RESPONSABLE_FINANCIER', 'RESPONSABLE_PASSATION_MARCHES', 'RESPONSABLE_SUIVI_EVALUATION', 'BAILLEUR', 'AUDITEUR', 'OBSERVATEUR');

-- CreateEnum
CREATE TYPE "StatutProjet" AS ENUM ('PREPARATION', 'ACTIF', 'SUSPENDU', 'CLOTURE', 'ANNULE');

-- CreateEnum
CREATE TYPE "NiveauIntervention" AS ENUM ('IMPACT', 'EFFET', 'RESULTAT', 'ACTIVITE');

-- CreateEnum
CREATE TYPE "StatutPTBA" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "StatutTache" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeMarche" AS ENUM ('TRAVAUX', 'FOURNITURES', 'SERVICES', 'CONSULTANTS');

-- CreateEnum
CREATE TYPE "MethodePassation" AS ENUM ('AOI', 'AON', 'DEMANDE_COTATION', 'SFQC', 'SMC', 'GRE_A_GRE');

-- CreateEnum
CREATE TYPE "TypeRevue" AS ENUM ('A_PRIORI', 'A_POSTERIORI');

-- CreateEnum
CREATE TYPE "StatutMarche" AS ENUM ('PLANIFIE', 'EN_COURS', 'ADJUGE', 'SIGNE', 'RESILIE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutRisque" AS ENUM ('IDENTIFIE', 'EN_COURS_ATTENUATION', 'RESIDU', 'CLOS');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('CONTRAT', 'RAPPORT', 'AUDIT', 'FACTURE', 'PV', 'PHOTO', 'AUTRE');

-- CreateEnum
CREATE TYPE "ActionAudit" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'CONNEXION', 'DECONNEXION', 'EXPORT', 'UPLOAD');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "refresh_token" TEXT,
    "reset_password_token" TEXT,
    "reset_password_expires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "code_projet" TEXT NOT NULL,
    "nom_projet" TEXT NOT NULL,
    "description" TEXT,
    "bailleur_principal" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "budget_total" DECIMAL(15,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "statut" "StatutProjet" NOT NULL DEFAULT 'PREPARATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projet_utilisateurs" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projet_utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadres_logiques" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "niveau_intervention" "NiveauIntervention" NOT NULL,
    "indicateur" TEXT NOT NULL,
    "valeur_reference" TEXT,
    "cible" TEXT,
    "source_verification" TEXT,
    "hypotheses" TEXT,
    "risques" TEXT,
    "commentaires" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cadres_logiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptba" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "code_activite" TEXT NOT NULL,
    "composante" TEXT NOT NULL,
    "activite" TEXT NOT NULL,
    "description" TEXT,
    "responsable" TEXT,
    "budget_prevu" DECIMAL(15,2) NOT NULL,
    "q1" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "q2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "q3" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "q4" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "statut" "StatutPTBA" NOT NULL DEFAULT 'PLANIFIE',
    "pourcentage_avancement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ptba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_budgetaires" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "code_budget" TEXT NOT NULL,
    "rubrique" TEXT NOT NULL,
    "sous_rubrique" TEXT,
    "unite" TEXT,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "cout_unitaire" DECIMAL(15,2) NOT NULL,
    "cout_total" DECIMAL(15,2) NOT NULL,
    "financement_bailleur" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "contrepartie_etat" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "lignes_budgetaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources_financement" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "nom_bailleur" TEXT NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "devise" TEXT NOT NULL,
    "date_financement" TIMESTAMP(3),
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sources_financement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wbs" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "code_wbs" TEXT NOT NULL,
    "nom_phase" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "wbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "wbs_id" TEXT,
    "ligne_budgetaire_id" TEXT,
    "code_tache" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsable" TEXT,
    "date_debut" TIMESTAMP(3),
    "date_fin" TIMESTAMP(3),
    "cout_prevu" DECIMAL(15,2) NOT NULL,
    "cout_reel" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "avancement" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "StatutTache" NOT NULL DEFAULT 'A_FAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operations" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "tache_id" TEXT NOT NULL,
    "date_operation" TIMESTAMP(3) NOT NULL,
    "statut" "StatutTache" NOT NULL,
    "montant_engage" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montant_decaisse" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "cree_par" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marches" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "description_marche" TEXT NOT NULL,
    "type_marche" "TypeMarche" NOT NULL,
    "methode" "MethodePassation" NOT NULL,
    "type_revue" "TypeRevue" NOT NULL,
    "date_prevue" TIMESTAMP(3),
    "date_signature" TIMESTAMP(3),
    "montant_estime" DECIMAL(15,2) NOT NULL,
    "statut" "StatutMarche" NOT NULL DEFAULT 'PLANIFIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "marches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risques" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probabilite" INTEGER NOT NULL,
    "impact" INTEGER NOT NULL,
    "criticite" INTEGER NOT NULL,
    "strategie_attenuation" TEXT,
    "responsable" TEXT,
    "statut" "StatutRisque" NOT NULL DEFAULT 'IDENTIFIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "risques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "url_fichier" TEXT NOT NULL,
    "type_document" "TypeDocument" NOT NULL,
    "taille_fichier" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "date_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploade_par" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT,
    "action" "ActionAudit" NOT NULL,
    "module" TEXT NOT NULL,
    "entite_id" TEXT,
    "ancienne_valeur" JSONB,
    "nouvelle_valeur" JSONB,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adresse_ip" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projets_code_projet_key" ON "projets"("code_projet");

-- CreateIndex
CREATE UNIQUE INDEX "projet_utilisateurs_projet_id_utilisateur_id_key" ON "projet_utilisateurs"("projet_id", "utilisateur_id");

-- AddForeignKey
ALTER TABLE "projet_utilisateurs" ADD CONSTRAINT "projet_utilisateurs_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projet_utilisateurs" ADD CONSTRAINT "projet_utilisateurs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadres_logiques" ADD CONSTRAINT "cadres_logiques_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptba" ADD CONSTRAINT "ptba_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_budgetaires" ADD CONSTRAINT "lignes_budgetaires_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources_financement" ADD CONSTRAINT "sources_financement_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wbs" ADD CONSTRAINT "wbs_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_wbs_id_fkey" FOREIGN KEY ("wbs_id") REFERENCES "wbs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_ligne_budgetaire_id_fkey" FOREIGN KEY ("ligne_budgetaire_id") REFERENCES "lignes_budgetaires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_tache_id_fkey" FOREIGN KEY ("tache_id") REFERENCES "taches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operations" ADD CONSTRAINT "operations_cree_par_fkey" FOREIGN KEY ("cree_par") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marches" ADD CONSTRAINT "marches_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risques" ADD CONSTRAINT "risques_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploade_par_fkey" FOREIGN KEY ("uploade_par") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
