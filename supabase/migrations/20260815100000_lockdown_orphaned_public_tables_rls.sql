-- ═══════════════════════════════════════════════════════════════════════════
-- URGENT — Correctif alerte Supabase rls_disabled_in_public
-- ═══════════════════════════════════════════════════════════════════════════
-- 9 tables du schéma public avaient RLS désactivée (rowsecurity = false),
-- confirmé par requête live sur pg_tables (pas par simple lecture des
-- migrations trackées, qui ne pouvaient pas voir ces tables — aucune des 9
-- n'est créée par une migration Supabase suivie dans ce dépôt).
--
-- 8 des 9 sont des tables héritées du schéma Prisma/NestJS d'origine,
-- remplacées par leur équivalent moderne (déjà en RLS) lors de la bascule
-- 100% Supabase, mais jamais verrouillées ni supprimées :
--   comments                  -> remplacée par project_comments
--   document_global_versions  -> remplacée par document_projet_versions
--   documents_globaux         -> remplacée par documents_projet
--   gouvernance                -> remplacée par project_team_members / _committee_members / _stakeholders / _contacts
--   project_members           -> remplacée par project_team_members
--   reports                   -> remplacée par rapports_projet
--   notification_preferences  -> jamais raccordée (préférences stockées côté store local)
--   _prisma_migrations        -> table technique (historique de migrations Prisma)
-- La 9e, refresh_tokens, est la plus sensible : jetons d'authentification
-- potentiellement réels, exposables via la clé anon publique tant qu'aucune
-- policy ne bloque l'accès.
--
-- Aucune de ces 9 tables n'est référencée par le code applicatif actuel
-- (migrations trackées, Edge Functions, frontend) — leur structure de
-- colonnes exacte n'est pas connue avec certitude ici. Plutôt que d'inventer
-- des policies de cloisonnement par organisation sur un schéma non vérifié,
-- le correctif applique le verrouillage le plus sûr : RLS activée, AUCUNE
-- policy définie — équivalent à un refus total pour les rôles anon/
-- authenticated, seul service_role (qui bypass RLS) garde l'accès. C'est le
-- même principe déjà appliqué à document_projet_versions/uploads dans ce
-- projet (SELECT-only, écriture réservée au service_role).
--
-- Si une reprise de données historiques depuis ces tables legacy est
-- souhaitée un jour, ce sera un projet de migration de données à part,
-- délibéré — pas une correction de sécurité urgente comme celle-ci.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public._prisma_migrations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_global_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_globaux        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gouvernance              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                  ENABLE ROW LEVEL SECURITY;

-- Défense en profondeur supplémentaire sur refresh_tokens, la table la plus
-- sensible : force également le "FORCE ROW LEVEL SECURITY" pour que même le
-- propriétaire de la table (si un rôle autre que service_role/postgres
-- possédait la table) ne puisse pas contourner RLS.
ALTER TABLE public.refresh_tokens FORCE ROW LEVEL SECURITY;
