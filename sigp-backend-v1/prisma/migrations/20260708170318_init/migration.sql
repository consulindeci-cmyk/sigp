-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINATEUR', 'CHARGE_PROGRAMME', 'FINANCIER', 'AUDITEUR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE');

-- CreateEnum
CREATE TYPE "RoleMembreProjet" AS ENUM ('CHEF_PROJET', 'COORDINATEUR', 'MEMBRE', 'OBSERVATEUR', 'VALIDATEUR');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'APPROUVE', 'REVISE', 'CLOTURE');

-- CreateEnum
CREATE TYPE "RiskProbability" AS ENUM ('FAIBLE', 'POSSIBLE', 'PROBABLE', 'QUASI_CERTAIN');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('FAIBLE', 'MODERE', 'IMPORTANT', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU', 'ACCEPTE', 'FERME');

-- CreateEnum
CREATE TYPE "LivrableStatus" AS ENUM ('NON_COMMENCE', 'EN_COURS', 'SOUMIS', 'EN_REVISION', 'VALIDE', 'REJETE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "PpmMarcheStatus" AS ENUM ('EN_PREPARATION', 'LANCE', 'SOUMISSION', 'EVALUATION', 'ATTRIBUTION', 'SIGNE', 'RESILIE', 'CLOTURE');

-- CreateEnum
CREATE TYPE "PpmTypeMarche" AS ENUM ('FOURNITURES', 'TRAVAUX', 'SERVICES', 'CONSULTANTS');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'CLOTURE', 'RESILIE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('MARCHE', 'CONVENTION', 'PROTOCOLE', 'LETTRE_ACCORD');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PLANIFIE', 'DEMANDE', 'APPROUVE', 'DECAISSE', 'REJETE');

-- CreateEnum
CREATE TYPE "PtbaStatut" AS ENUM ('NON_DEMARRE', 'EN_COURS', 'TERMINE', 'ANNULE', 'EN_RETARD');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE', 'REJETE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('BUDGET', 'EVM', 'RISQUES', 'GLOBAL', 'PTBA', 'EXPORT_EXCEL');

-- CreateEnum
CREATE TYPE "TypeRapport" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'ANNUEL', 'FINANCIER', 'EVM', 'RISQUES', 'PTBA', 'BAILLEUR', 'AVANCEMENT', 'FINAL');

-- CreateEnum
CREATE TYPE "StatutRapport" AS ENUM ('GENERE', 'EN_ATTENTE', 'VALIDE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "FormatRapport" AS ENUM ('PDF', 'EXCEL', 'WORD');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('RISQUE_CRITIQUE', 'LIVRABLE_EN_RETARD', 'BUDGET_DEPASSE', 'EVM_ALERTE_CPI', 'EVM_ALERTE_SPI', 'DOCUMENT_VALIDE', 'RAPPORT_PRET', 'MENTION_COMMENTAIRE', 'PROJET_STATUT_CHANGE', 'BUDGET_VALIDE', 'CONTRAT_EXPIRE', 'PAIEMENT_DU', 'INVITATION_PROJET');

-- CreateEnum
CREATE TYPE "WbsNodeType" AS ENUM ('PHASE', 'LOT', 'ACTIVITE', 'LIVRABLE');

-- CreateEnum
CREATE TYPE "FundingSourceType" AS ENUM ('BAILLEUR', 'CONTREPARTIE_NATIONALE', 'AUTRE');

-- CreateEnum
CREATE TYPE "LogframeLevel" AS ENUM ('OBJECTIF_GLOBAL', 'OBJECTIF_SPECIFIQUE', 'RESULTAT', 'ACTIVITE');

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('IMPACT', 'OUTCOME', 'OUTPUT', 'PROCESS');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('RECETTE', 'DEPENSE', 'VIREMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'VALIDATE', 'REJECT');

-- CreateEnum
CREATE TYPE "OrganisationType" AS ENUM ('MINISTERE', 'INSTITUTION', 'ONG', 'PARTENAIRE', 'COLLECTIVITE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ProgrammeStatus" AS ENUM ('EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mot_de_passe" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "langue_preference" VARCHAR(5) NOT NULL DEFAULT 'fr',
    "telephone" VARCHAR(30),
    "avatar_url" VARCHAR(500),
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "type" "OrganisationType" NOT NULL DEFAULT 'AUTRE',
    "description" TEXT,
    "email" VARCHAR(255),
    "telephone" VARCHAR(30),
    "site_web" VARCHAR(255),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directions" (
    "id" UUID NOT NULL,
    "organisation_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "directions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departements" (
    "id" UUID NOT NULL,
    "direction_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unites" (
    "id" UUID NOT NULL,
    "departement_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "unites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes" (
    "id" UUID NOT NULL,
    "unite_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "statut" "ProgrammeStatus" NOT NULL DEFAULT 'EN_PREPARATION',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_debut" DATE,
    "date_fin" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "statut" "ProjectStatus" NOT NULL DEFAULT 'EN_PREPARATION',
    "date_debut" DATE,
    "date_fin_prevue" DATE,
    "date_fin_effective" DATE,
    "date_cloture_effective" DATE,
    "manager_id" UUID,
    "programme_id" UUID,
    "budget_total" DECIMAL(18,2),
    "devise" VARCHAR(3) NOT NULL DEFAULT 'XOF',
    "pays" VARCHAR(100),
    "secteur" VARCHAR(100),
    "bailleur_principal" VARCHAR(255),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_projet" "RoleMembreProjet" NOT NULL DEFAULT 'MEMBRE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_debut" DATE,
    "date_fin" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gouvernance" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "organisation" VARCHAR(200),
    "email" VARCHAR(255),
    "telephone" VARCHAR(30),
    "user_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gouvernance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logframe_objectives" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "niveau" "LogframeLevel" NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "logframe_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logframe_indicators" (
    "id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "IndicatorType" NOT NULL DEFAULT 'OUTPUT',
    "unite" VARCHAR(50),
    "valeur_baseline" DECIMAL(18,4),
    "valeur_cible" DECIMAL(18,4),
    "valeur_actuelle" DECIMAL(18,4),
    "source_verification" TEXT,
    "periodicite" VARCHAR(50),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "logframe_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wbs_nodes" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_id" UUID,
    "objective_id" UUID,
    "code" VARCHAR(30) NOT NULL,
    "libelle" VARCHAR(500) NOT NULL,
    "type" "WbsNodeType" NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "responsable_id" UUID,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_debut" DATE,
    "date_fin" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "wbs_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_versions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nom" VARCHAR(100) NOT NULL,
    "statut" "BudgetStatus" NOT NULL DEFAULT 'BROUILLON',
    "montant_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "approuve_par" UUID,
    "approuve_le" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "budget_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lignes" (
    "id" UUID NOT NULL,
    "version_id" UUID NOT NULL,
    "parent_id" UUID,
    "code_ligne" VARCHAR(30) NOT NULL,
    "libelle" VARCHAR(500) NOT NULL,
    "categorie" VARCHAR(100),
    "montant_prevu" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "montant_engage" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "montant_paye" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "budget_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_operations" (
    "id" UUID NOT NULL,
    "budget_ligne_id" UUID NOT NULL,
    "type" "JournalType" NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "date_operation" DATE NOT NULL,
    "reference" VARCHAR(100),
    "description" TEXT,
    "piece_jointe_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "journal_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_sources" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "type" "FundingSourceType" NOT NULL DEFAULT 'BAILLEUR',
    "montant" DECIMAL(18,2) NOT NULL,
    "pourcentage" DECIMAL(5,2),
    "devise" VARCHAR(3) NOT NULL DEFAULT 'XOF',
    "date_accord" DATE,
    "date_expiry" DATE,
    "contact" VARCHAR(200),
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "funding_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppm_marches" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "intitule" VARCHAR(500) NOT NULL,
    "type" "PpmTypeMarche" NOT NULL,
    "statut" "PpmMarcheStatus" NOT NULL DEFAULT 'EN_PREPARATION',
    "montant_estime" DECIMAL(18,2),
    "montant_signe" DECIMAL(18,2),
    "date_lancement_prevu" DATE,
    "date_soumission_prevu" DATE,
    "date_attribution" DATE,
    "date_signature" DATE,
    "date_fin_prevue" DATE,
    "date_fin_effective" DATE,
    "titulaire" VARCHAR(255),
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ppm_marches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppm_etapes" (
    "id" UUID NOT NULL,
    "marche_id" UUID NOT NULL,
    "libelle" VARCHAR(200) NOT NULL,
    "ordre" INTEGER NOT NULL,
    "date_prevue" DATE,
    "date_reelle" DATE,
    "complete" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_etapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "marche_id" UUID,
    "numero" VARCHAR(100) NOT NULL,
    "intitule" VARCHAR(500) NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'MARCHE',
    "statut" "ContractStatus" NOT NULL DEFAULT 'ACTIF',
    "titulaire" VARCHAR(255) NOT NULL,
    "montant" DECIMAL(18,2) NOT NULL,
    "devise" VARCHAR(3) NOT NULL DEFAULT 'XOF',
    "date_signature" DATE,
    "date_debut" DATE,
    "date_fin" DATE,
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disbursements" (
    "id" UUID NOT NULL,
    "budget_version_id" UUID,
    "budget_ligne_id" UUID,
    "contract_id" UUID,
    "funding_source_id" UUID,
    "statut" "DisbursementStatus" NOT NULL DEFAULT 'PLANIFIE',
    "montant" DECIMAL(18,2) NOT NULL,
    "date_prevue" DATE,
    "date_reelle" DATE,
    "reference" VARCHAR(100),
    "description" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ptba_activites" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "wbs_id" UUID,
    "logframe_ref_id" UUID,
    "code" VARCHAR(50) NOT NULL,
    "libelle" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "statut" "PtbaStatut" NOT NULL DEFAULT 'NON_DEMARRE',
    "annee" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "date_debut_prevue" DATE,
    "date_fin_prevue" DATE,
    "date_debut_reelle" DATE,
    "date_fin_reelle" DATE,
    "montant_prevu" DECIMAL(18,2),
    "montant_realise" DECIMAL(18,2),
    "taux_realisation" DECIMAL(5,2),
    "responsable_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ptba_activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risques" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "wbs_id" UUID,
    "code" VARCHAR(20),
    "description" TEXT NOT NULL,
    "categorie" VARCHAR(100),
    "probabilite" "RiskProbability" NOT NULL,
    "impact" "RiskImpact" NOT NULL,
    "niveau_criticite" VARCHAR(20) NOT NULL,
    "statut" "RiskStatus" NOT NULL DEFAULT 'OUVERT',
    "strategie" TEXT,
    "plan_action" TEXT,
    "responsable_id" UUID,
    "date_detection" DATE,
    "date_echeance" DATE,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "risques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livrables" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "wbs_id" UUID,
    "code" VARCHAR(20),
    "nom" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "statut" "LivrableStatus" NOT NULL DEFAULT 'NON_COMMENCE',
    "date_prevue" DATE,
    "date_soumission" DATE,
    "date_validation" DATE,
    "responsable_id" UUID,
    "validateur_id" UUID,
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "livrables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evm_snapshots" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "periode" VARCHAR(7) NOT NULL,
    "pv" DECIMAL(18,2) NOT NULL,
    "ev" DECIMAL(18,2) NOT NULL,
    "ac" DECIMAL(18,2) NOT NULL,
    "bac" DECIMAL(18,2) NOT NULL,
    "eac" DECIMAL(18,2) NOT NULL,
    "cv" DECIMAL(18,2) NOT NULL,
    "sv" DECIMAL(18,2) NOT NULL,
    "cpi" DECIMAL(8,4) NOT NULL,
    "spi" DECIMAL(8,4) NOT NULL,
    "vac" DECIMAL(18,2) NOT NULL,
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evm_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(500) NOT NULL,
    "stored_name" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "detected_type" VARCHAR(100),
    "size_bytes" BIGINT NOT NULL,
    "sha256" VARCHAR(64),
    "bucket" VARCHAR(100) NOT NULL,
    "key" VARCHAR(500) NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "scan_clean" BOOLEAN,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents_projet" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "livrable_id" UUID,
    "titre" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "statut" "DocumentStatus" NOT NULL DEFAULT 'BROUILLON',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports_projet" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "code_rapport" VARCHAR(20) NOT NULL,
    "titre" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "type" "TypeRapport" NOT NULL,
    "format" "FormatRapport" NOT NULL,
    "statut" "StatutRapport" NOT NULL DEFAULT 'GENERE',
    "periode" VARCHAR(50) NOT NULL,
    "date_generation" DATE NOT NULL,
    "date_telechargement" DATE,
    "version" VARCHAR(20) NOT NULL,
    "auteur" VARCHAR(200) NOT NULL,
    "taille_ko" INTEGER NOT NULL DEFAULT 0,
    "nb_telechargements" INTEGER NOT NULL DEFAULT 0,
    "commentaires" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rapports_projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_projet_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "numero_version" INTEGER NOT NULL DEFAULT 1,
    "upload_id" UUID NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_projet_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents_globaux" (
    "id" UUID NOT NULL,
    "titre" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "categorie" VARCHAR(100),
    "statut" "DocumentStatus" NOT NULL DEFAULT 'BROUILLON',
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_globaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_global_versions" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "numero_version" INTEGER NOT NULL DEFAULT 1,
    "upload_id" UUID NOT NULL,
    "date_version" DATE NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_global_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "type" "ReportType" NOT NULL,
    "statut" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "parametres" JSONB,
    "fichier_url" VARCHAR(500),
    "erreur" TEXT,
    "requested_by" UUID,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historique" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "table_cible" VARCHAR(100) NOT NULL,
    "enregistrement_id" VARCHAR(36),
    "avant" JSONB,
    "apres" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_id" UUID,
    "type" "TypeNotification" NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email_risque_critique" BOOLEAN NOT NULL DEFAULT true,
    "email_livrable_retard" BOOLEAN NOT NULL DEFAULT true,
    "email_budget_depasse" BOOLEAN NOT NULL DEFAULT true,
    "email_rapport_pret" BOOLEAN NOT NULL DEFAULT true,
    "email_mention" BOOLEAN NOT NULL DEFAULT true,
    "in_app_all" BOOLEAN NOT NULL DEFAULT true,
    "frequence_digest" VARCHAR(20) NOT NULL DEFAULT 'daily',

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "contenu" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_code_key" ON "organisations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_nom_key" ON "organisations"("nom");

-- CreateIndex
CREATE INDEX "organisations_actif_idx" ON "organisations"("actif");

-- CreateIndex
CREATE INDEX "organisations_deleted_at_idx" ON "organisations"("deleted_at");

-- CreateIndex
CREATE INDEX "directions_organisation_id_idx" ON "directions"("organisation_id");

-- CreateIndex
CREATE INDEX "directions_deleted_at_idx" ON "directions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "directions_organisation_id_code_key" ON "directions"("organisation_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "directions_organisation_id_nom_key" ON "directions"("organisation_id", "nom");

-- CreateIndex
CREATE INDEX "departements_direction_id_idx" ON "departements"("direction_id");

-- CreateIndex
CREATE INDEX "departements_deleted_at_idx" ON "departements"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "departements_direction_id_code_key" ON "departements"("direction_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departements_direction_id_nom_key" ON "departements"("direction_id", "nom");

-- CreateIndex
CREATE INDEX "unites_departement_id_idx" ON "unites"("departement_id");

-- CreateIndex
CREATE INDEX "unites_deleted_at_idx" ON "unites"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "unites_departement_id_code_key" ON "unites"("departement_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "unites_departement_id_nom_key" ON "unites"("departement_id", "nom");

-- CreateIndex
CREATE INDEX "programmes_unite_id_idx" ON "programmes"("unite_id");

-- CreateIndex
CREATE INDEX "programmes_statut_idx" ON "programmes"("statut");

-- CreateIndex
CREATE INDEX "programmes_deleted_at_idx" ON "programmes"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_unite_id_code_key" ON "programmes"("unite_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_unite_id_nom_key" ON "programmes"("unite_id", "nom");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_statut_idx" ON "projects"("statut");

-- CreateIndex
CREATE INDEX "projects_manager_id_idx" ON "projects"("manager_id");

-- CreateIndex
CREATE INDEX "projects_programme_id_idx" ON "projects"("programme_id");

-- CreateIndex
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");

-- CreateIndex
CREATE INDEX "project_members_project_id_idx" ON "project_members"("project_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

-- CreateIndex
CREATE INDEX "project_members_deleted_at_idx" ON "project_members"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "gouvernance_project_id_idx" ON "gouvernance"("project_id");

-- CreateIndex
CREATE INDEX "logframe_objectives_project_id_idx" ON "logframe_objectives"("project_id");

-- CreateIndex
CREATE INDEX "logframe_objectives_deleted_at_idx" ON "logframe_objectives"("deleted_at");

-- CreateIndex
CREATE INDEX "logframe_indicators_objective_id_idx" ON "logframe_indicators"("objective_id");

-- CreateIndex
CREATE INDEX "logframe_indicators_deleted_at_idx" ON "logframe_indicators"("deleted_at");

-- CreateIndex
CREATE INDEX "wbs_nodes_project_id_idx" ON "wbs_nodes"("project_id");

-- CreateIndex
CREATE INDEX "wbs_nodes_objective_id_idx" ON "wbs_nodes"("objective_id");

-- CreateIndex
CREATE INDEX "wbs_nodes_deleted_at_idx" ON "wbs_nodes"("deleted_at");

-- CreateIndex
CREATE INDEX "budget_versions_deleted_at_idx" ON "budget_versions"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "budget_versions_project_id_version_key" ON "budget_versions"("project_id", "version");

-- CreateIndex
CREATE INDEX "budget_lignes_version_id_idx" ON "budget_lignes"("version_id");

-- CreateIndex
CREATE INDEX "budget_lignes_deleted_at_idx" ON "budget_lignes"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lignes_version_id_code_ligne_key" ON "budget_lignes"("version_id", "code_ligne");

-- CreateIndex
CREATE INDEX "journal_operations_budget_ligne_id_idx" ON "journal_operations"("budget_ligne_id");

-- CreateIndex
CREATE INDEX "journal_operations_deleted_at_idx" ON "journal_operations"("deleted_at");

-- CreateIndex
CREATE INDEX "funding_sources_project_id_idx" ON "funding_sources"("project_id");

-- CreateIndex
CREATE INDEX "funding_sources_deleted_at_idx" ON "funding_sources"("deleted_at");

-- CreateIndex
CREATE INDEX "ppm_marches_project_id_idx" ON "ppm_marches"("project_id");

-- CreateIndex
CREATE INDEX "ppm_marches_deleted_at_idx" ON "ppm_marches"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "ppm_marches_project_id_code_key" ON "ppm_marches"("project_id", "code");

-- CreateIndex
CREATE INDEX "contracts_project_id_idx" ON "contracts"("project_id");

-- CreateIndex
CREATE INDEX "contracts_deleted_at_idx" ON "contracts"("deleted_at");

-- CreateIndex
CREATE INDEX "disbursements_budget_version_id_idx" ON "disbursements"("budget_version_id");

-- CreateIndex
CREATE INDEX "disbursements_budget_ligne_id_idx" ON "disbursements"("budget_ligne_id");

-- CreateIndex
CREATE INDEX "disbursements_deleted_at_idx" ON "disbursements"("deleted_at");

-- CreateIndex
CREATE INDEX "ptba_activites_project_id_annee_trimestre_idx" ON "ptba_activites"("project_id", "annee", "trimestre");

-- CreateIndex
CREATE INDEX "risques_project_id_statut_idx" ON "risques"("project_id", "statut");

-- CreateIndex
CREATE INDEX "risques_deleted_at_idx" ON "risques"("deleted_at");

-- CreateIndex
CREATE INDEX "livrables_project_id_statut_idx" ON "livrables"("project_id", "statut");

-- CreateIndex
CREATE INDEX "livrables_deleted_at_idx" ON "livrables"("deleted_at");

-- CreateIndex
CREATE INDEX "evm_snapshots_project_id_periode_idx" ON "evm_snapshots"("project_id", "periode");

-- CreateIndex
CREATE UNIQUE INDEX "evm_snapshots_project_id_periode_key" ON "evm_snapshots"("project_id", "periode");

-- CreateIndex
CREATE INDEX "documents_projet_project_id_idx" ON "documents_projet"("project_id");

-- CreateIndex
CREATE INDEX "documents_projet_deleted_at_idx" ON "documents_projet"("deleted_at");

-- CreateIndex
CREATE INDEX "rapports_projet_project_id_statut_idx" ON "rapports_projet"("project_id", "statut");

-- CreateIndex
CREATE INDEX "rapports_projet_deleted_at_idx" ON "rapports_projet"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_projet_versions_document_id_numero_version_key" ON "document_projet_versions"("document_id", "numero_version");

-- CreateIndex
CREATE UNIQUE INDEX "document_global_versions_document_id_numero_version_key" ON "document_global_versions"("document_id", "numero_version");

-- CreateIndex
CREATE INDEX "reports_project_id_statut_idx" ON "reports"("project_id", "statut");

-- CreateIndex
CREATE INDEX "historique_project_id_idx" ON "historique"("project_id");

-- CreateIndex
CREATE INDEX "historique_user_id_idx" ON "historique"("user_id");

-- CreateIndex
CREATE INDEX "historique_created_at_idx" ON "historique"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_lue_idx" ON "notifications"("user_id", "lue");

-- CreateIndex
CREATE INDEX "notifications_expires_at_idx" ON "notifications"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_deleted_at_idx" ON "notifications"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "comments_project_id_idx" ON "comments"("project_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "directions" ADD CONSTRAINT "directions_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departements" ADD CONSTRAINT "departements_direction_id_fkey" FOREIGN KEY ("direction_id") REFERENCES "directions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unites" ADD CONSTRAINT "unites_departement_id_fkey" FOREIGN KEY ("departement_id") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_unite_id_fkey" FOREIGN KEY ("unite_id") REFERENCES "unites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_programme_id_fkey" FOREIGN KEY ("programme_id") REFERENCES "programmes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gouvernance" ADD CONSTRAINT "gouvernance_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gouvernance" ADD CONSTRAINT "gouvernance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logframe_objectives" ADD CONSTRAINT "logframe_objectives_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logframe_objectives" ADD CONSTRAINT "logframe_objectives_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "logframe_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logframe_indicators" ADD CONSTRAINT "logframe_indicators_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "logframe_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wbs_nodes" ADD CONSTRAINT "wbs_nodes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wbs_nodes" ADD CONSTRAINT "wbs_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "wbs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wbs_nodes" ADD CONSTRAINT "wbs_nodes_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "logframe_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lignes" ADD CONSTRAINT "budget_lignes_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "budget_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lignes" ADD CONSTRAINT "budget_lignes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "budget_lignes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_operations" ADD CONSTRAINT "journal_operations_budget_ligne_id_fkey" FOREIGN KEY ("budget_ligne_id") REFERENCES "budget_lignes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_sources" ADD CONSTRAINT "funding_sources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_marches" ADD CONSTRAINT "ppm_marches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppm_etapes" ADD CONSTRAINT "ppm_etapes_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "ppm_marches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_marche_id_fkey" FOREIGN KEY ("marche_id") REFERENCES "ppm_marches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_budget_version_id_fkey" FOREIGN KEY ("budget_version_id") REFERENCES "budget_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_budget_ligne_id_fkey" FOREIGN KEY ("budget_ligne_id") REFERENCES "budget_lignes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_funding_source_id_fkey" FOREIGN KEY ("funding_source_id") REFERENCES "funding_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptba_activites" ADD CONSTRAINT "ptba_activites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptba_activites" ADD CONSTRAINT "ptba_activites_wbs_id_fkey" FOREIGN KEY ("wbs_id") REFERENCES "wbs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptba_activites" ADD CONSTRAINT "ptba_activites_logframe_ref_id_fkey" FOREIGN KEY ("logframe_ref_id") REFERENCES "logframe_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risques" ADD CONSTRAINT "risques_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risques" ADD CONSTRAINT "risques_wbs_id_fkey" FOREIGN KEY ("wbs_id") REFERENCES "wbs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livrables" ADD CONSTRAINT "livrables_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livrables" ADD CONSTRAINT "livrables_wbs_id_fkey" FOREIGN KEY ("wbs_id") REFERENCES "wbs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evm_snapshots" ADD CONSTRAINT "evm_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_projet" ADD CONSTRAINT "documents_projet_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents_projet" ADD CONSTRAINT "documents_projet_livrable_id_fkey" FOREIGN KEY ("livrable_id") REFERENCES "livrables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports_projet" ADD CONSTRAINT "rapports_projet_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_projet_versions" ADD CONSTRAINT "document_projet_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents_projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_global_versions" ADD CONSTRAINT "document_global_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents_globaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique" ADD CONSTRAINT "historique_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historique" ADD CONSTRAINT "historique_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
