-- ═══════════════════════════════════════════════════════════════════════════
-- Chantier interconnexion — Vague 3 : planification automatique (pg_cron)
-- ═══════════════════════════════════════════════════════════════════════════
-- Séparée de 20260721100000 (fonctions de calcul) : si pg_cron n'est pas
-- disponible/activé sur ce projet Supabase, seule CETTE migration échoue —
-- les fonctions de calcul restent utilisables via RPC ou l'Edge Function
-- evm-snapshot-generate (déclenchement manuel), sans dépendre du succès de
-- cette planification.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Retire une éventuelle planification précédente du même nom avant de la
-- recréer (migration idempotente en cas de ré-exécution).
DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'evm-monthly-snapshot';
EXCEPTION WHEN OTHERS THEN
  NULL; -- pg_cron pas encore initialisé ou aucun job existant : sans effet
END $$;

-- Le 1er de chaque mois à 02h00 UTC — génère l'instantané EVM du mois pour
-- tous les projets actifs (cf. generate_evm_snapshots()).
SELECT cron.schedule(
  'evm-monthly-snapshot',
  '0 2 1 * *',
  $$ SELECT public.generate_evm_snapshots(); $$
);
