/*
  Warnings:

  - You are about to drop the `operations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeJournalEvent" AS ENUM ('ENGAGEMENT_BUDGETAIRE', 'DECAISSEMENT', 'ANNULATION_ENGAGEMENT', 'REVERSEMENT', 'CREATION_MARCHE', 'CLOTURE_TACHE');

-- CreateEnum
CREATE TYPE "TypeEntiteLiee" AS ENUM ('TACHE', 'MARCHE', 'LIGNE_BUDGETAIRE');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_cree_par_fkey";

-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_projet_id_fkey";

-- DropForeignKey
ALTER TABLE "operations" DROP CONSTRAINT "operations_tache_id_fkey";

-- DropTable
DROP TABLE "operations";

-- CreateTable
CREATE TABLE "journal_operations" (
    "id" TEXT NOT NULL,
    "numero_sequence" SERIAL NOT NULL,
    "code_operation" TEXT NOT NULL,
    "projet_id" TEXT NOT NULL,
    "type_evenement" "TypeJournalEvent" NOT NULL,
    "entite_type" "TypeEntiteLiee" NOT NULL,
    "entite_id" TEXT NOT NULL,
    "entite_snapshot" JSONB,
    "montant_engage" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "montant_decaisse" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "date_operation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "adresse_ip" TEXT,
    "hash_signature" TEXT NOT NULL,
    "previous_hash" TEXT,

    CONSTRAINT "journal_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "auteur_id" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "journal_operations_code_operation_key" ON "journal_operations"("code_operation");

-- CreateIndex
CREATE INDEX "journal_operations_projet_id_date_operation_idx" ON "journal_operations"("projet_id", "date_operation");

-- CreateIndex
CREATE INDEX "journal_operations_numero_sequence_idx" ON "journal_operations"("numero_sequence");

-- CreateIndex
CREATE INDEX "outbox_events_status_createdAt_idx" ON "outbox_events"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "journal_operations" ADD CONSTRAINT "journal_operations_projet_id_fkey" FOREIGN KEY ("projet_id") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_operations" ADD CONSTRAINT "journal_operations_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
