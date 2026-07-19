-- ═══════════════════════════════════════════════════════════════════════════
-- Correctif — generate_evm_snapshots() omettait la colonne bac (NOT NULL)
-- ═══════════════════════════════════════════════════════════════════════════
-- Bug préexistant, indépendant du chantier EVM de cette session :
-- generate_evm_snapshots() (20260721100000) insérait (id, project_id,
-- periode, pv, ev, ac) mais jamais bac, alors que evm_snapshots.bac est
-- NOT NULL. calculate_project_evm() retourne pourtant (pv, ev, ac, bac) — la
-- valeur était calculée puis silencieusement jetée.
--
-- Conséquence réelle : CHAQUE appel à generate_evm_snapshots() a toujours
-- échoué avec "null value in column bac ... violates not-null constraint",
-- y compris le pg_cron mensuel (evm-monthly-snapshot) depuis sa création —
-- jamais détecté avant car rien ne consommait cette Edge Function / ce cron
-- jusqu'à l'ajout du bouton "Générer un instantané" dans TabEVM.tsx, qui l'a
-- immédiatement fait échouer de façon visible.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_evm_snapshots()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_periode text := to_char(now(), 'YYYY-MM');
  v_count integer := 0;
  rec record;
  v_evm record;
BEGIN
  FOR rec IN
    SELECT id FROM public.projects WHERE deleted_at IS NULL AND statut <> 'CLOTURE'
  LOOP
    SELECT * INTO v_evm FROM public.calculate_project_evm(rec.id);

    DELETE FROM public.evm_snapshots WHERE project_id = rec.id AND periode = v_periode;
    INSERT INTO public.evm_snapshots (id, project_id, periode, pv, ev, ac, bac)
    VALUES (gen_random_uuid(), rec.id, v_periode, v_evm.pv, v_evm.ev, v_evm.ac, v_evm.bac);

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
