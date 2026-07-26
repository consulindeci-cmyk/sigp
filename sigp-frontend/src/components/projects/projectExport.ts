import { supabase } from '@/lib/supabaseClient';
import { statusToStatut, adaptProjectDto, type ProjectRow } from '@/lib/projectAdapter';
import { PROJECT_SELECT, flatten, fetchBatchAggregations, type RawRow } from '@/hooks/useProjects';

/**
 * Exporte l'ensemble des projets correspondant aux filtres actifs en téléchargeant le jeu de données complet
 * (sans se limiter à une seule page) — même filtrage que useProjects(), RLS gère déjà l'org-scoping.
 * Tâche 12 : L'export doit exporter l'ensemble des projets et ne jamais exporter uniquement la page courante.
 */
export async function exportAllProjectsToCSV({
  search,
  sortBy,
  sortOrder,
  filters,
  statut,
  programmeId,
  managerId,
}: {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | undefined>;
  statut?: string;
  programmeId?: string;
  managerId?: string;
}): Promise<void> {
  let query = supabase.from('projects').select(PROJECT_SELECT).is('deleted_at', null);

  if (search) {
    query = query.or(`nom.ilike.%${search}%,code.ilike.%${search}%`);
  }

  let statutFilter = statut
    ? (['EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE'].includes(statut) ? statut : statusToStatut(statut))
    : undefined;
  let bailleurFilter: string | undefined;
  let secteurFilter: string | undefined;
  let paysFilter: string | undefined;
  let organisationFilter: string | undefined;
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      if (key === 'status' || key === 'statut') {
        const valStr = String(value);
        statutFilter = ['EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE'].includes(valStr) ? valStr : statusToStatut(valStr);
      } else if (key === 'donor' || key === 'bailleurPrincipal') bailleurFilter = String(value);
      else if (key === 'sector' || key === 'secteur') secteurFilter = String(value);
      else if (key === 'country' || key === 'pays') paysFilter = String(value);
      else if (key === 'organisation') organisationFilter = String(value);
    }
  }

  if (statutFilter) query = query.eq('statut', statutFilter);
  if (programmeId) query = query.eq('programme_id', programmeId);
  if (managerId) query = query.eq('manager_id', managerId);
  if (bailleurFilter) query = query.eq('bailleur_principal', bailleurFilter);
  if (secteurFilter) query = query.eq('secteur', secteurFilter);
  if (paysFilter) query = query.eq('pays', paysFilter);

  // SUPER_ADMIN uniquement — même résolution organisation → programme_id que
  // useProjects(), sinon l'export CSV ignore silencieusement le filtre
  // "Organisation" actif à l'écran et renvoie les projets de toutes les
  // organisations au lieu de la seule sélectionnée.
  if (organisationFilter) {
    const { data: programmeIds, error: programmeIdsError } = await supabase.rpc('organisation_programme_ids', {
      p_organisation_id: organisationFilter,
    });
    if (programmeIdsError) throw programmeIdsError;
    query = query.in('programme_id', (programmeIds ?? []).length > 0 ? programmeIds : ['00000000-0000-0000-0000-000000000000']);
  }

  const sortColumnMap: Record<string, string> = {
    nom: 'nom', code: 'code', statut: 'statut', createdAt: 'created_at',
    budgetTotal: 'budget_total', dateFinPrevue: 'date_fin_prevue',
  };
  const sortCol = sortBy && sortColumnMap[sortBy] ? sortColumnMap[sortBy] : 'created_at';
  // Pas de pagination par page comme l'ancienne boucle NestJS : Supabase renvoie
  // tout en une seule requête (plafond large, largement suffisant ici).
  query = query.order(sortCol, { ascending: sortOrder === 'asc' }).range(0, 9999);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data as unknown as RawRow[]).map(flatten);
  const aggMap = await fetchBatchAggregations(rows.map((r) => ({ id: r.id, budgetTotal: r.budgetTotal })));
  const enriched = rows.map((r) => ({
    ...r,
    ...(aggMap.get(r.id) ?? { progressScore: 0, tauxDecaissement: 0, composantes: 0, activites: 0 }),
  }));

  const projects: ProjectRow[] = enriched.map(adaptProjectDto);

  const headers = [
    'Code', 'Nom du projet', 'Bailleur', 'Secteur', 'Pays', 'Chef de Projet',
    'Statut', 'Budget Total', 'Devise', 'Date Début', 'Date Fin Prévue',
    'Progression (%)', 'Profil Qualité (%)', 'Taux Décaissement (%)',
  ];

  const dataRows = projects.map((p) => [
    p.code,
    p.name,
    p.donor,
    p.sector,
    p.country,
    p.manager,
    p.status,
    String(p.budgetTotal),
    p.devise,
    p.startDate,
    p.endDate,
    String(p.progressScore),
    String(p.profileScore),
    String(p.tauxDecaissement),
  ]);

  const csv = '﻿' + [headers, ...dataRows]
    .map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projets-complets-sigp-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
