-- ═══════════════════════════════════════════════════════════════════════════
-- Cadre Logique — branchement sur le vrai modèle IOV
-- ═══════════════════════════════════════════════════════════════════════════
-- Jusqu'ici, le frontend encodait niveau PRODUIT / baseline / cible / source
-- de vérification / hypothèses dans un blob JSON caché à l'intérieur de
-- logframe_objectives.description (préfixe __LF_META__:) — fragile (perdu si
-- quoi que ce soit d'autre écrit dans description) et déconnecté de la vraie
-- table logframe_indicators, qui existe déjà avec ses propres Edge Functions
-- mais n'était jamais appelée depuis l'UI.
--
-- Cette migration :
-- 1. Ajoute deux colonnes propres sur logframe_objectives : le niveau
--    d'intervention frontend réel (PRODUIT devient un niveau de première
--    classe, plus besoin de le comprimer sur RESULTAT) et les hypothèses.
-- 2. Backfill best-effort des lignes existantes depuis l'ancien JSON cité.
-- 3. Backfill des indicateurs IOV existants vers logframe_indicators — les
--    anciennes valeurs baseline/cible étaient du texte libre (ex: "500
--    bénéficiaires", "80%") alors que valeur_baseline/valeur_cible sont
--    numériques ; on extrait au mieux la partie numérique en tête de chaîne
--    et le reste devient l'unité. Les lignes qui ne contiennent aucun nombre
--    exploitable sont tracées dans historique plutôt que perdues.
--
-- description n'est PAS vidée par cette migration : elle devient simplement
-- inutilisée par l'app, ce qui préserve un filet de sécurité brut si le
-- backfill ci-dessous a un angle mort non anticipé sur des données réelles.

ALTER TABLE public.logframe_objectives
  ADD COLUMN IF NOT EXISTS niveau_intervention_fe text
    CHECK (niveau_intervention_fe IN ('IMPACT', 'OBJECTIF', 'RESULTAT', 'PRODUIT', 'ACTIVITE')),
  ADD COLUMN IF NOT EXISTS hypotheses text;

-- ── 2. Backfill niveau_intervention_fe + hypotheses ──────────────────────────
DO $$
DECLARE
  r RECORD;
  meta jsonb;
BEGIN
  FOR r IN SELECT id, niveau, description FROM public.logframe_objectives WHERE niveau_intervention_fe IS NULL LOOP
    meta := NULL;
    IF r.description LIKE '__LF_META__:%' THEN
      BEGIN
        meta := substring(r.description FROM 13)::jsonb;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'logframe_objectives %: description JSON illisible, repli sur le niveau backend', r.id;
        meta := NULL;
      END;
    END IF;

    UPDATE public.logframe_objectives
    SET
      niveau_intervention_fe = COALESCE(
        meta->>'feNiveau',
        CASE r.niveau
          WHEN 'OBJECTIF_GLOBAL' THEN 'IMPACT'
          WHEN 'OBJECTIF_SPECIFIQUE' THEN 'OBJECTIF'
          WHEN 'RESULTAT' THEN 'RESULTAT'
          WHEN 'ACTIVITE' THEN 'ACTIVITE'
          ELSE 'ACTIVITE'
        END
      ),
      hypotheses = CASE
        WHEN meta IS NOT NULL THEN NULLIF(meta->>'hypotheses', '')
        WHEN r.description IS NOT NULL AND r.description NOT LIKE '__LF_META__:%' THEN r.description
        ELSE NULL
      END
    WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.logframe_objectives
  ALTER COLUMN niveau_intervention_fe SET NOT NULL;

-- ── 3. Backfill des indicateurs IOV vers logframe_indicators ────────────────
DO $$
DECLARE
  r RECORD;
  meta jsonb;
  raw_baseline text;
  raw_cible text;
  m_baseline text[];
  m_cible text[];
  num_baseline numeric;
  num_cible numeric;
  unite_val text;
  needs_review boolean;
BEGIN
  FOR r IN
    SELECT id, project_id, libelle, description FROM public.logframe_objectives
    WHERE description LIKE '__LF_META__:%'
  LOOP
    BEGIN
      meta := substring(r.description FROM 13)::jsonb;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    raw_baseline := NULLIF(meta->>'valeur_reference', '');
    raw_cible := NULLIF(meta->>'cible', '');

    IF raw_baseline IS NULL AND raw_cible IS NULL AND NULLIF(meta->>'source_verification', '') IS NULL THEN
      CONTINUE;
    END IF;

    num_baseline := NULL;
    num_cible := NULL;
    unite_val := NULL;
    needs_review := false;

    IF raw_baseline IS NOT NULL THEN
      m_baseline := regexp_match(trim(raw_baseline), '^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$');
      IF m_baseline IS NOT NULL THEN
        num_baseline := replace(m_baseline[1], ',', '.')::numeric;
        IF m_baseline[2] IS NOT NULL AND m_baseline[2] != '' THEN unite_val := m_baseline[2]; END IF;
      ELSE
        needs_review := true;
      END IF;
    END IF;

    IF raw_cible IS NOT NULL THEN
      m_cible := regexp_match(trim(raw_cible), '^([0-9]+(?:[.,][0-9]+)?)\s*(.*)$');
      IF m_cible IS NOT NULL THEN
        num_cible := replace(m_cible[1], ',', '.')::numeric;
        IF unite_val IS NULL AND m_cible[2] IS NOT NULL AND m_cible[2] != '' THEN unite_val := m_cible[2]; END IF;
      ELSE
        needs_review := true;
      END IF;
    END IF;

    BEGIN
      INSERT INTO public.logframe_indicators (
        id, objective_id, code, libelle, type, unite,
        valeur_baseline, valeur_cible, source_verification,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), r.id,
        'IND-MIGR-' || upper(substr(replace(r.id::text, '-', ''), 1, 10)),
        'IOV — ' || left(coalesce(r.libelle, 'Indicateur principal'), 180),
        'OUTPUT', unite_val,
        num_baseline, num_cible, NULLIF(meta->>'source_verification', ''),
        now(), now()
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'logframe_objectives % : échec création indicateur migré (%), objectif conservé sans backfill IOV', r.id, SQLERRM;
      CONTINUE;
    END;

    IF needs_review THEN
      -- Valeur non numérique non convertible automatiquement (ex: texte pur
      -- sans nombre en tête) : pas d'insert dans historique ici (pas
      -- d'utilisateur "acteur" dans le contexte d'une migration, et
      -- historique.user_id est NOT NULL) — juste tracée dans les logs de
      -- migration pour revue manuelle, l'indicateur reste créé sans
      -- valeur_baseline/valeur_cible plutôt que de perdre l'objectif entier.
      RAISE NOTICE 'logframe_objectives % : baseline="%" cible="%" non convertibles en nombre — indicateur créé sans ces valeurs, à corriger manuellement', r.id, raw_baseline, raw_cible;
    END IF;
  END LOOP;
END $$;
