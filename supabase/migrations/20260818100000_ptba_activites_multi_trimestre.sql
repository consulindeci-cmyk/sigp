-- ═══════════════════════════════════════════════════════════════════════════
-- PTBA — support multi-trimestres par activité
-- ═══════════════════════════════════════════════════════════════════════════
-- Le modèle Excel d'origine permet de cocher une même activité sur plusieurs
-- trimestres (ex: Q1, Q2 et Q3) — le modèle applicatif imposait jusqu'ici un
-- seul trimestre par ligne (ptba_activites.trimestre, integer). Remplacé par
-- un tableau trimestres (integer[]), contraint non vide et à des valeurs 1-4.
--
-- Le montant (montant_prevu) reste un total unique par activité — c'est la
-- ventilation par mois/trimestre affichée dans la matrice (calculée côté
-- frontend, cf. distributeMonthly dans usePTBA.ts) qui se répartit désormais
-- également sur TOUS les trimestres cochés, plus seulement sur un seul.
--
-- ptba_activites n'est créée par aucune migration trackée (table héritée,
-- comme projects/users) — ALTER direct sans CREATE TABLE de référence.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ptba_activites ADD COLUMN IF NOT EXISTS trimestres integer[];

-- Backfill : chaque activité existante ne portait qu'un seul trimestre.
UPDATE public.ptba_activites
SET trimestres = ARRAY[trimestre]
WHERE trimestres IS NULL AND trimestre IS NOT NULL;

ALTER TABLE public.ptba_activites ALTER COLUMN trimestres SET NOT NULL;

ALTER TABLE public.ptba_activites
  ADD CONSTRAINT ptba_activites_trimestres_check CHECK (
    array_length(trimestres, 1) > 0
    AND trimestres <@ ARRAY[1, 2, 3, 4]
  );

ALTER TABLE public.ptba_activites DROP COLUMN trimestre;
