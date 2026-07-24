-- ═══════════════════════════════════════════════════════════════════════════
-- ppm_marches — colonnes dédiées pour wbs_id, budget_ligne_id, méthode et
-- type de revue (remplacent le JSON __PPM_META__ planqué dans `notes`)
-- ═══════════════════════════════════════════════════════════════════════════
-- Contexte (audit PPM) : le formulaire de marché rattache déjà une vraie
-- activité WBS et une vraie ligne budgétaire, mais faute de colonnes dédiées,
-- usePPM.ts (serializeNotes/parseNotes) sérialisait wbs_id/budget_ligne_id/
-- methode/type_revue (+ d'autres champs) dans un JSON planqué derrière un
-- préfixe __PPM_META__ à l'intérieur de la colonne texte `notes`. Aucune
-- intégrité FK réelle, aucun filtrage/jointure SQL possible sur ces champs.
--
-- Cette migration ajoute les 4 colonnes réellement rattachables à une entité
-- externe (wbs_id, budget_ligne_id) ou nécessitant une vraie contrainte de
-- valeur métier (methode, type_revue), puis migre les données existantes.
--
-- Note volontairement PAS migrées vers une colonne dédiée (et donc PERDUES à
-- l'issue de cette migration, `notes` étant entièrement nettoyée) : les
-- refontes successives du formulaire PPM (Sections 1-4) ont déjà retiré ces
-- champs de l'UI et de la persistance côté frontend — ils n'ont plus aucun
-- consommateur :
--   - bailleur_id / devise_code / taux_change_estime / montant_estime_devise
--     : le formulaire n'utilise plus qu'une seule devise (celle du projet,
--       cf. Section 4 "Montant Estimé") et dérive désormais le bailleur
--       depuis la ligne budgétaire rattachée à la volée, sans le persister.
--   - est_lot_unique / lots_enfants_ids / contrats_generes_ids : aucune
--     gestion de lots n'a jamais été implémentée (cf. audit PPM).
--   - les 6 dates de chronogramme non couvertes par une colonne réelle déjà
--     existante (preparation_dao_*, remise_offres_reelle, evaluation_*,
--     ano_*, attribution_reelle, demarrage_reelle) : retirées de l'UI lors
--     de la restructuration du formulaire (Section 3 "Calendrier & Jalons"
--     ne garde que Date Avis/Publication et Date Signature).
--
-- Date Avis/Publication et Date Signature du Contrat NE sont PAS dupliquées
-- ici : elles ont déjà de vraies colonnes de longue date
-- (date_lancement_prevu, date_signature), déjà lues/écrites correctement
-- par ppm-create/ppm-update/usePPM.ts — leur ajout sous un autre nom aurait
-- simplement créé un doublon de schéma.

ALTER TABLE public.ppm_marches
  ADD COLUMN IF NOT EXISTS wbs_id uuid REFERENCES public.wbs_nodes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS budget_ligne_id uuid REFERENCES public.budget_lignes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS methode text,
  ADD COLUMN IF NOT EXISTS type_revue text;

CREATE INDEX IF NOT EXISTS idx_ppm_marches_wbs_id ON public.ppm_marches (wbs_id);
CREATE INDEX IF NOT EXISTS idx_ppm_marches_budget_ligne_id ON public.ppm_marches (budget_ligne_id);

-- ── Migration des données existantes ─────────────────────────────────────────
-- Un marché à la fois : le JSON de chaque ligne est isolé (BEGIN/EXCEPTION
-- par itération) pour qu'une entrée corrompue ou une référence WBS/Budget
-- devenue invalide (FK non satisfaite) n'interrompe pas la migration des
-- autres lignes — elle est simplement ignorée, `notes` restant inchangée
-- pour investigation manuelle.
DO $$
DECLARE
  r RECORD;
  meta jsonb;
  v_migrated int := 0;
  v_skipped  int := 0;
BEGIN
  FOR r IN
    SELECT id, notes FROM public.ppm_marches
    WHERE notes LIKE '__PPM_META__:%'
  LOOP
    BEGIN
      meta := substring(r.notes FROM length('__PPM_META__:') + 1)::jsonb;

      UPDATE public.ppm_marches SET
        wbs_id          = NULLIF(meta->>'wbs_id', '')::uuid,
        budget_ligne_id = NULLIF(meta->>'budget_ligne_id', '')::uuid,
        methode         = NULLIF(meta->>'methode', ''),
        type_revue      = NULLIF(meta->>'type_revue', ''),
        notes           = NULL
      WHERE id = r.id;

      v_migrated := v_migrated + 1;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      RAISE NOTICE 'ppm_marches % : migration notes -> colonnes ignorée (%) — notes conservée telle quelle', r.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '% marché(s) migré(s) depuis notes vers wbs_id/budget_ligne_id/methode/type_revue, % ignoré(s)', v_migrated, v_skipped;
END $$;
