-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif — organisations sans hiérarchie programme (bug "programmeId est
-- obligatoire" à la création d'un projet)
-- ═══════════════════════════════════════════════════════════════════════════
-- organisations-create est le SEUL endroit qui provisionne la hiérarchie
-- minimale (direction → département → unité → programme) requise par
-- projects-create. Toute organisation créée par un autre chemin (avant
-- l'ajout de ce provisioning, ou via un rattachement manuel) se retrouve
-- sans aucun programme, donc dans l'incapacité totale de créer un projet
-- — exactement le blocage remonté par l'utilisateur.
--
-- Cette migration rattrape rétroactivement toutes les organisations
-- existantes sans programme, en leur créant la même hiérarchie minimale que
-- organisations-create (mêmes codes/noms, par cohérence). Idempotente : ne
-- touche que les organisations dont la chaîne directions→...→programmes est
-- vide ; ré-exécuter cette migration sur une base déjà corrigée ne crée rien
-- de plus.

DO $$
DECLARE
  v_org record;
  v_direction_id uuid;
  v_departement_id uuid;
  v_unite_id uuid;
BEGIN
  FOR v_org IN
    SELECT o.id
    FROM public.organisations o
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.programmes p
      JOIN public.unites u ON u.id = p.unite_id
      JOIN public.departements d ON d.id = u.departement_id
      JOIN public.directions dir ON dir.id = d.direction_id
      WHERE dir.organisation_id = o.id
    )
  LOOP
    v_direction_id := gen_random_uuid();
    INSERT INTO public.directions (id, organisation_id, code, nom, updated_at)
    VALUES (v_direction_id, v_org.id, 'DG', 'Direction Générale', now());

    v_departement_id := gen_random_uuid();
    INSERT INTO public.departements (id, direction_id, code, nom, updated_at)
    VALUES (v_departement_id, v_direction_id, 'DEP-01', 'Département Principal', now());

    v_unite_id := gen_random_uuid();
    INSERT INTO public.unites (id, departement_id, code, nom, updated_at)
    VALUES (v_unite_id, v_departement_id, 'UNI-01', 'Unité Principale', now());

    INSERT INTO public.programmes (id, unite_id, code, nom, updated_at)
    VALUES (gen_random_uuid(), v_unite_id, 'PRG-01', 'Programme Principal', now());
  END LOOP;
END $$;
