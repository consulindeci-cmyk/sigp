-- CreateIndex
CREATE INDEX "audit_logs_horodatage_idx" ON "audit_logs"("horodatage");

-- CreateIndex
CREATE INDEX "audit_logs_utilisateur_id_idx" ON "audit_logs"("utilisateur_id");

-- CreateIndex
CREATE INDEX "projets_deletedAt_statut_idx" ON "projets"("deletedAt", "statut");

-- CreateIndex
CREATE INDEX "taches_projet_id_deletedAt_statut_idx" ON "taches"("projet_id", "deletedAt", "statut");

-- CreateIndex
CREATE INDEX "utilisateurs_deletedAt_email_idx" ON "utilisateurs"("deletedAt", "email");

-- CreateIndex
CREATE INDEX "utilisateurs_reset_password_token_idx" ON "utilisateurs"("reset_password_token");
