-- CreateEnum
CREATE TYPE "FundingSourceStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'CLOTURE');

-- AlterTable
ALTER TABLE "budget_lignes" ADD COLUMN     "wbs_id" UUID;

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "funding_source_id" UUID;

-- AlterTable
ALTER TABLE "disbursements" ADD COLUMN     "project_id" UUID;

-- AlterTable
ALTER TABLE "funding_sources" ADD COLUMN     "statut" "FundingSourceStatus" NOT NULL DEFAULT 'ACTIF';

-- AlterTable
ALTER TABLE "journal_operations" ADD COLUMN     "disbursement_id" UUID;

-- CreateIndex
CREATE INDEX "budget_lignes_version_id_categorie_idx" ON "budget_lignes"("version_id", "categorie");

-- CreateIndex
CREATE INDEX "budget_lignes_parent_id_idx" ON "budget_lignes"("parent_id");

-- CreateIndex
CREATE INDEX "budget_lignes_wbs_id_idx" ON "budget_lignes"("wbs_id");

-- CreateIndex
CREATE INDEX "budget_versions_project_id_idx" ON "budget_versions"("project_id");

-- CreateIndex
CREATE INDEX "budget_versions_project_id_statut_idx" ON "budget_versions"("project_id", "statut");

-- CreateIndex
CREATE INDEX "contracts_funding_source_id_idx" ON "contracts"("funding_source_id");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_project_id_numero_key" ON "contracts"("project_id", "numero");

-- CreateIndex
CREATE INDEX "disbursements_project_id_idx" ON "disbursements"("project_id");

-- CreateIndex
CREATE INDEX "disbursements_contract_id_idx" ON "disbursements"("contract_id");

-- CreateIndex
CREATE INDEX "disbursements_funding_source_id_idx" ON "disbursements"("funding_source_id");

-- CreateIndex
CREATE INDEX "disbursements_date_prevue_idx" ON "disbursements"("date_prevue");

-- CreateIndex
CREATE INDEX "disbursements_date_reelle_idx" ON "disbursements"("date_reelle");

-- CreateIndex
CREATE INDEX "funding_sources_project_id_statut_idx" ON "funding_sources"("project_id", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "funding_sources_project_id_nom_key" ON "funding_sources"("project_id", "nom");

-- CreateIndex
CREATE INDEX "journal_operations_disbursement_id_idx" ON "journal_operations"("disbursement_id");

-- CreateIndex
CREATE INDEX "journal_operations_date_operation_idx" ON "journal_operations"("date_operation");

-- AddForeignKey
ALTER TABLE "budget_lignes" ADD CONSTRAINT "budget_lignes_wbs_id_fkey" FOREIGN KEY ("wbs_id") REFERENCES "wbs_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_operations" ADD CONSTRAINT "journal_operations_disbursement_id_fkey" FOREIGN KEY ("disbursement_id") REFERENCES "disbursements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_funding_source_id_fkey" FOREIGN KEY ("funding_source_id") REFERENCES "funding_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disbursements" ADD CONSTRAINT "disbursements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
