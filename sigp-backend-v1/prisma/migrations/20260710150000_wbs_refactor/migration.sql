-- CreateEnum
CREATE TYPE "WbsStatus" AS ENUM ('NON_COMMENCE', 'EN_COURS', 'EN_RETARD', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "WbsPriority" AS ENUM ('FAIBLE', 'MOYENNE', 'ELEVEE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "TypeActeurGouvernance" AS ENUM ('EQUIPE_PROJET', 'COMITE_PILOTAGE', 'COMITE_TECHNIQUE', 'BAILLEUR', 'CONTACT');

-- CreateEnum
CREATE TYPE "StatutActeur" AS ENUM ('ACTIF', 'INACTIF', 'EN_CONGE');

-- CreateEnum
CREATE TYPE "NiveauEngagement" AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE');

-- AlterEnum
BEGIN;
CREATE TYPE "LogframeLevel_new" AS ENUM ('IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE');
ALTER TABLE "logframe_objectives" ALTER COLUMN "niveau" TYPE "LogframeLevel_new" USING ("niveau"::text::"LogframeLevel_new");
ALTER TYPE "LogframeLevel" RENAME TO "LogframeLevel_old";
ALTER TYPE "LogframeLevel_new" RENAME TO "LogframeLevel";
DROP TYPE "public"."LogframeLevel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WbsNodeType_new" AS ENUM ('PHASE', 'SOUS_PHASE', 'LOT', 'SOUS_LOT', 'WORK_PACKAGE', 'TACHE', 'SOUS_TACHE', 'MILESTONE');
ALTER TABLE "wbs_nodes" ALTER COLUMN "type" TYPE "WbsNodeType_new" USING ("type"::text::"WbsNodeType_new");
ALTER TYPE "WbsNodeType" RENAME TO "WbsNodeType_old";
ALTER TYPE "WbsNodeType_new" RENAME TO "WbsNodeType";
DROP TYPE "public"."WbsNodeType_old";
COMMIT;

-- AlterTable
ALTER TABLE "gouvernance" ADD COLUMN     "categorie_contact" VARCHAR(100),
ADD COLUMN     "date_debut" DATE,
ADD COLUMN     "date_fin" DATE,
ADD COLUMN     "niveau_engagement" "NiveauEngagement",
ADD COLUMN     "prenom" VARCHAR(100),
ADD COLUMN     "president_role" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "statut" "StatutActeur" NOT NULL DEFAULT 'ACTIF',
ADD COLUMN     "type_acteur" "TypeActeurGouvernance" NOT NULL DEFAULT 'EQUIPE_PROJET';

-- AlterTable
ALTER TABLE "logframe_objectives" ADD COLUMN     "cible" TEXT,
ADD COLUMN     "hypotheses" TEXT,
ADD COLUMN     "risques" TEXT,
ADD COLUMN     "source_verification" TEXT,
ADD COLUMN     "valeur_reference" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organisation_id" UUID;

-- AlterTable
ALTER TABLE "wbs_nodes" ADD COLUMN     "budget_alloue" DECIMAL(18,2),
ADD COLUMN     "charge_estimee" INTEGER,
ADD COLUMN     "date_debut_reelle" DATE,
ADD COLUMN     "date_fin_reelle" DATE,
ADD COLUMN     "priorite" "WbsPriority" NOT NULL DEFAULT 'MOYENNE',
ADD COLUMN     "progression_physique" DECIMAL(5,2),
ADD COLUMN     "statut" "WbsStatus" NOT NULL DEFAULT 'NON_COMMENCE';

-- CreateIndex
CREATE INDEX "contracts_project_id_statut_idx" ON "contracts"("project_id", "statut");

-- CreateIndex
CREATE INDEX "gouvernance_type_acteur_idx" ON "gouvernance"("type_acteur");

-- CreateIndex
CREATE INDEX "logframe_objectives_project_id_niveau_idx" ON "logframe_objectives"("project_id", "niveau");

-- CreateIndex
CREATE INDEX "logframe_objectives_parent_id_ordre_idx" ON "logframe_objectives"("parent_id", "ordre");

-- CreateIndex
CREATE INDEX "projects_programme_id_statut_idx" ON "projects"("programme_id", "statut");

-- CreateIndex
CREATE INDEX "users_organisation_id_idx" ON "users"("organisation_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
