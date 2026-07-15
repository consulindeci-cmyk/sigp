import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { invokeEdgeFunction } from '@/lib/supabaseFunctions';
import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const reportKeys = {
  all:     ()            => ['reports'] as const,
  project: (pid: string) => ['reports', pid] as const,
};

// ── Ligne Supabase (colonnes snake_case de `rapports_projet`) ────────────────

interface RapportRow {
  id: string;
  project_id: string;
  code_rapport: string;
  titre: string;
  description: string | null;
  type: TypeRapport;
  format: FormatRapport;
  statut: StatutRapport;
  periode: string;
  date_generation: string;
  date_telechargement: string | null;
  version: string;
  auteur: string;
  taille_ko: number;
  nb_telechargements: number;
  commentaires: string | null;
  created_at: string;
  updated_at: string;
}

const REPORT_SELECT = `
  id, project_id, code_rapport, titre, description, type, format, statut,
  periode, date_generation, date_telechargement, version, auteur, taille_ko,
  nb_telechargements, commentaires, created_at, updated_at
`;

// ── Adapter ───────────────────────────────────────────────────────────────────

function adaptReport(row: RapportRow): RapportProjet {
  return {
    id:                  row.id,
    projet_id:           row.project_id,
    code_rapport:        row.code_rapport,
    titre:               row.titre,
    description:         row.description ?? undefined,
    type:                row.type,
    format:              row.format,
    statut:              row.statut,
    periode:             row.periode,
    date_generation:     row.date_generation?.slice(0, 10) ?? '',
    date_telechargement: row.date_telechargement?.slice(0, 10) ?? undefined,
    version:             row.version,
    auteur:              row.auteur,
    taille_ko:           row.taille_ko,
    nb_telechargements:  row.nb_telechargements,
    commentaires:        row.commentaires ?? undefined,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

// ── Fetch (global ou par projet) ───────────────────────────────────────────────

async function fetchReports(projectId?: string): Promise<RapportProjet[]> {
  let query = supabase
    .from('rapports_projet')
    .select(REPORT_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as RapportRow[]).map(adaptReport);
}

// ── Read hook (global or per-project) ────────────────────────────────────────

export function useReports(projectId?: string) {
  return useQuery({
    queryKey:  projectId ? reportKeys.project(projectId) : reportKeys.all(),
    queryFn:   () => fetchReports(projectId),
    enabled:   projectId !== undefined ? !!projectId : true,
  });
}

// ── DTO builders (FE snake_case → payload camelCase Edge Function) ────────────

export interface ReportSaveFEPayload {
  projet_id:           string;
  code_rapport:        string;
  titre:               string;
  description?:        string;
  type:                TypeRapport;
  format:              FormatRapport;
  statut:              StatutRapport;
  periode:             string;
  version:             string;
  auteur:              string;
  taille_ko:           number;
  commentaires?:       string;
  date_generation:     string;
  nb_telechargements:  number;
  date_telechargement?: string;
}

function toCreatePayload(p: ReportSaveFEPayload) {
  return {
    projectId:          p.projet_id,
    codeRapport:        p.code_rapport,
    titre:              p.titre,
    description:        p.description,
    type:               p.type,
    format:             p.format,
    statut:             p.statut,
    periode:            p.periode,
    dateGeneration:     p.date_generation,
    dateTelechargement: p.date_telechargement,
    version:            p.version,
    auteur:             p.auteur,
    tailleKo:           p.taille_ko,
    nbTelechargements:  p.nb_telechargements,
    commentaires:       p.commentaires,
  };
}

function toUpdatePayload(payload: Partial<RapportProjet>): Record<string, unknown> {
  const dto: Record<string, unknown> = {};
  if (payload.code_rapport      !== undefined) dto.codeRapport        = payload.code_rapport;
  if (payload.titre             !== undefined) dto.titre              = payload.titre;
  if (payload.description       !== undefined) dto.description        = payload.description;
  if (payload.type              !== undefined) dto.type               = payload.type;
  if (payload.format            !== undefined) dto.format             = payload.format;
  if (payload.statut            !== undefined) dto.statut             = payload.statut;
  if (payload.periode           !== undefined) dto.periode            = payload.periode;
  if (payload.date_generation   !== undefined) dto.dateGeneration     = payload.date_generation;
  if (payload.date_telechargement !== undefined) dto.dateTelechargement = payload.date_telechargement;
  if (payload.version           !== undefined) dto.version            = payload.version;
  if (payload.auteur            !== undefined) dto.auteur             = payload.auteur;
  if (payload.taille_ko         !== undefined) dto.tailleKo           = payload.taille_ko;
  if (payload.nb_telechargements !== undefined) dto.nbTelechargements  = payload.nb_telechargements;
  if (payload.commentaires      !== undefined) dto.commentaires       = payload.commentaires;
  return dto;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function invalidate(qc: ReturnType<typeof useQueryClient>, projectId?: string) {
  qc.invalidateQueries({ queryKey: reportKeys.all() });
  if (projectId) qc.invalidateQueries({ queryKey: reportKeys.project(projectId) });
}

export function useCreateReport(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReportSaveFEPayload) => {
      const { data } = await invokeEdgeFunction<{ data: RapportRow }>('reports-create', toCreatePayload(payload));
      return adaptReport(data);
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}

export function useUpdateReport(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RapportProjet> & { id: string }) => {
      const { data } = await invokeEdgeFunction<{ data: RapportRow }>('reports-update', { id, ...toUpdatePayload(payload) });
      return adaptReport(data);
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}

export function useDeleteReport(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      await invokeEdgeFunction<{ message: string }>('reports-delete', { id: reportId });
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}
