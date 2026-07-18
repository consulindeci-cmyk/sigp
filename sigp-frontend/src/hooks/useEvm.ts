import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Réplique fidèlement EvmService.getEvmSummary/getEvmHistory (project.controller.ts
// délègue à src/projects/evm.service.ts, routes réelles :id/evm/summary et
// :id/evm/history — confirmées existantes, contrairement au reste du module).
//
// Vague 3 (automatisation EVM) : la formule PV/EV/AC/BAC est désormais
// calculée par la fonction SQL calculate_project_evm() (une seule
// implémentation, partagée avec generate_evm_snapshots() qui alimente
// evm_snapshots pour l'historique/dashboard-summary) — ce hook ne fait plus
// que l'appeler via RPC et dériver les ratios (SV/CV/SPI/CPI/EAC/etc.), qui
// restent du calcul pur sans accès aux données.
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
      const { data, error } = await supabase
        .rpc('calculate_project_evm', { p_project_id: projectId })
        .single();
      if (error) throw error;

      const row = data as { pv: number; ev: number; ac: number; bac: number };
      const bac = Number(row.bac ?? 0);
      const ac = Number(row.ac ?? 0);
      const pv = Number(row.pv ?? 0);
      const ev = Number(row.ev ?? 0);

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
