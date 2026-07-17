import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Réplique fidèlement EvmService.getEvmSummary/getEvmHistory (project.controller.ts
// délègue à src/projects/evm.service.ts, routes réelles :id/evm/summary et
// :id/evm/history — confirmées existantes, contrairement au reste du module).
// Calcul entièrement lecture seule à partir de tables déjà RLS-protégées
// (budget_lignes, ptba_activites, evm_snapshots) — pas besoin d'Edge Function.
//
// NOTE nettoyage (per feedback_proactive_improvements) : l'ancienne section
// "OLD HOOKS" (useEvm/useEvmTasks/useEvmTrend, appelant /projects/:id/evm,
// /evm/tasks, /evm/trend — trois routes qui n'ont jamais existé côté NestJS)
// était du code mort : useEvmTasks/useEvmTrend ne sont importés nulle part,
// et useEvm n'apparaît que dans un commentaire resté sans suite dans
// TabEVM.tsx, jamais réellement appelé. Supprimées.
// ─────────────────────────────────────────────────────────────────────────────

export interface EvmSummary {
  pv: number;
  ev: number;
  ac: number;
  sv: number;
  cv: number;
  spi: number;
  cpi: number;
  bac: number;
  eac: number;
  etc: number;
  vac: number;
  tcpi: number;
}

export interface EvmHistoryPoint {
  periode: string;
  pv: number;
  ev: number;
  ac: number;
}

export const useProjectEvmSummary = (projectId: string) => {
  return useQuery<EvmSummary>({
    queryKey: ['projects', projectId, 'evm', 'summary'],
    queryFn: async () => {
      const [budgetRes, activitesRes] = await Promise.all([
        supabase
          .from('budget_lignes')
          .select('montant_prevu, montant_paye, version:budget_versions!inner(project_id)')
          .is('deleted_at', null)
          .eq('version.project_id', projectId),
        supabase
          .from('ptba_activites')
          .select('montant_prevu, taux_realisation, date_debut_prevue, date_fin_prevue')
          .is('deleted_at', null)
          .eq('project_id', projectId),
      ]);
      if (budgetRes.error) throw budgetRes.error;
      if (activitesRes.error) throw activitesRes.error;

      const bac = (budgetRes.data ?? []).reduce((s, l) => s + Number(l.montant_prevu ?? 0), 0);
      const ac = (budgetRes.data ?? []).reduce((s, l) => s + Number(l.montant_paye ?? 0), 0);

      let pv = 0;
      let ev = 0;
      const now = Date.now();

      for (const act of activitesRes.data ?? []) {
        const budget = Number(act.montant_prevu ?? 0);
        const taux = Number(act.taux_realisation ?? 0);
        ev += budget * (taux / 100);

        if (act.date_debut_prevue && act.date_fin_prevue) {
          const debut = new Date(act.date_debut_prevue).getTime();
          const fin = new Date(act.date_fin_prevue).getTime();
          if (now >= fin) {
            pv += budget;
          } else if (now > debut) {
            pv += budget * ((now - debut) / (fin - debut));
          }
        }
        // Fallback si pas de dates : aucune PV planifiée pour cette activité (fidèle à evm.service.ts).
      }

      const sv = ev - pv;
      const cv = ev - ac;
      const spi = pv > 0 ? ev / pv : 1;
      const cpi = ac > 0 ? ev / ac : 1;
      const eac = cpi > 0 ? bac / cpi : bac;
      const etc = eac - ac;
      const vac = bac - eac;
      // TCPI standard (basé sur BAC) : performance restante nécessaire pour tenir le budget initial.
      const tcpi = (bac - ac) !== 0 ? (bac - ev) / (bac - ac) : 1;

      return {
        pv: Math.round(pv),
        ev: Math.round(ev),
        ac: Math.round(ac),
        sv: Math.round(sv),
        cv: Math.round(cv),
        spi: Number(spi.toFixed(4)),
        cpi: Number(cpi.toFixed(4)),
        bac: Math.round(bac),
        eac: Math.round(eac),
        etc: Math.round(etc),
        vac: Math.round(vac),
        tcpi: Number(tcpi.toFixed(4)),
      };
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
};

export const useProjectEvmHistory = (projectId: string) => {
  return useQuery<EvmHistoryPoint[]>({
    queryKey: ['projects', projectId, 'evm', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evm_snapshots')
        .select('periode, pv, ev, ac')
        .eq('project_id', projectId)
        .order('periode', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s) => ({ periode: s.periode, pv: Number(s.pv), ev: Number(s.ev), ac: Number(s.ac) }));
    },
    enabled: !!projectId,
    refetchOnWindowFocus: false,
  });
};
