import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { RapportProjet, TypeRapport, StatutRapport, FormatRapport } from '@/types';

// ── Cache keys ────────────────────────────────────────────────────────────────

export const reportKeys = {
  all:     ()            => ['reports'] as const,
  project: (pid: string) => ['reports', pid] as const,
};

// ── Backend DTO (NestJS camelCase response) ───────────────────────────────────

interface ReportDto {
  id:                 string;
  projectId:          string;
  codeRapport:        string;
  titre:              string;
  description:        string | null;
  type:               TypeRapport;
  format:             FormatRapport;
  statut:             StatutRapport;
  periode:            string;
  dateGeneration:     string;
  dateTelechargement: string | null;
  version:            string;
  auteur:             string;
  tailleKo:           number;
  nbTelechargements:  number;
  commentaires:       string | null;
  createdBy:          string | null;
  updatedBy:          string | null;
  createdAt:          string;
  updatedAt:          string;
}

// ── Adapter ReportDto → RapportProjet ─────────────────────────────────────────

function adaptReport(dto: ReportDto): RapportProjet {
  return {
    id:                  dto.id,
    projet_id:           dto.projectId,
    code_rapport:        dto.codeRapport,
    titre:               dto.titre,
    description:         dto.description ?? undefined,
    type:                dto.type,
    format:              dto.format,
    statut:              dto.statut,
    periode:             dto.periode,
    date_generation:     dto.dateGeneration?.slice(0, 10) ?? '',
    date_telechargement: dto.dateTelechargement?.slice(0, 10) ?? undefined,
    version:             dto.version,
    auteur:              dto.auteur,
    taille_ko:           dto.tailleKo,
    nb_telechargements:  dto.nbTelechargements,
    commentaires:        dto.commentaires ?? undefined,
    createdAt:           dto.createdAt,
    updatedAt:           dto.updatedAt,
  };
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchReports(projectId?: string): Promise<RapportProjet[]> {
  const params: Record<string, string | number> = { limit: 100 };
  if (projectId) params.projectId = projectId;
  const { data } = await api.get('/reports', { params });
  const raw: unknown = data?.data?.data ?? data?.data ?? data;
  const dtos: ReportDto[] = Array.isArray(raw) ? raw : [];
  return dtos.map(adaptReport);
}

// ── Read hook (global or per-project) ────────────────────────────────────────

export function useReports(projectId?: string) {
  return useQuery({
    queryKey:  projectId ? reportKeys.project(projectId) : reportKeys.all(),
    queryFn:   () => fetchReports(projectId),
    enabled:   projectId !== undefined ? !!projectId : true,

  });
}

// ── DTO builders (FE snake_case → BE camelCase) ───────────────────────────────

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

function toCreateDto(p: ReportSaveFEPayload) {
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

function toUpdateDto(payload: Partial<RapportProjet>): Record<string, unknown> {
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
      const { data } = await api.post('/reports', toCreateDto(payload));
      return adaptReport(data?.data ?? data);
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}

export function useUpdateReport(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RapportProjet> & { id: string }) => {
      const { data } = await api.patch(`/reports/${id}`, toUpdateDto(payload));
      return adaptReport(data?.data ?? data);
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}

export function useDeleteReport(projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/reports/${reportId}`);
    },
    onSuccess: () => invalidate(qc, projectId),
    onError:   () => invalidate(qc, projectId),
  });
}
