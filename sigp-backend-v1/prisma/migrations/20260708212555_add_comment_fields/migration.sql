/*
  Warnings:

  - You are about to drop the column `contenu` on the `comments` table. All the data in the column will be lost.
  - Added the required column `message` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "comments" DROP COLUMN "contenu",
ADD COLUMN     "element_id" VARCHAR(100),
ADD COLUMN     "element_nom" VARCHAR(500),
ADD COLUMN     "lu" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mention" VARCHAR(500),
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "module" VARCHAR(100),
ADD COLUMN     "piece_jointe" VARCHAR(500),
ADD COLUMN     "priorite" VARCHAR(50) NOT NULL DEFAULT 'NORMALE',
ADD COLUMN     "statut" VARCHAR(50) NOT NULL DEFAULT 'OUVERT';

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");
