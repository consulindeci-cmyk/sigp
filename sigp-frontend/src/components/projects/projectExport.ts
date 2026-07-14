import api from '@/lib/axios';
import { statusToStatut, adaptProjectDto, type ProjectApiDto, type ProjectRow } from '@/lib/projectAdapter';

/**
 * Exporte l'ensemble des projets correspondant aux filtres actifs en téléchargeant le jeu de données complet
 * depuis le backend (sans se limiter aux 20 projets de la page courante).
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
  const queryParams: Record<string, string | number | undefined> = {
    page: 1,
    limit: 100,
  };
  if (search) queryParams.search = search;
  if (sortBy) queryParams.sortBy = sortBy;
  if (sortOrder) queryParams.sortOrder = sortOrder;
  if (statut) {
    const isEnum = ['EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE'].includes(statut);
    queryParams.statut = isEnum ? statut : statusToStatut(statut);
  }
  if (programmeId) queryParams.programmeId = programmeId;
  if (managerId) queryParams.managerId = managerId;
  if (filters) {
    const allowedKeys = [
      'page', 'limit', 'search', 'sortBy', 'sortOrder',
      'programmeId', 'statut', 'managerId', 'organisationId',
      'bailleurPrincipal', 'secteur', 'pays',
    ];
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'status' || key === 'statut') {
          const valStr = String(value);
          const isEnum = ['EN_PREPARATION', 'EN_COURS', 'SUSPENDU', 'CLOTURE', 'ANNULE'].includes(valStr);
          queryParams.statut = isEnum ? valStr : statusToStatut(valStr);
        } else if (key === 'donor' || key === 'bailleurPrincipal') {
          queryParams.bailleurPrincipal = String(value);
        } else if (key === 'sector' || key === 'secteur') {
          queryParams.secteur = String(value);
        } else if (key === 'country' || key === 'pays') {
          queryParams.pays = String(value);
        } else if (allowedKeys.includes(key)) {
          queryParams[key] = value;
        }
      }
    }
  }

  const { data } = await api.get('/projects', { params: queryParams });
  const rawList: ProjectApiDto[] = Array.isArray(data?.data?.data)
    ? data.data.data
    : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));

  const totalPages = Number(data?.data?.meta?.totalPages ?? data?.meta?.totalPages ?? 1);

  if (totalPages > 1) {
    const pagePromises: Promise<ProjectApiDto[]>[] = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        api.get('/projects', { params: { ...queryParams, page } }).then((res) => {
          const resData = res.data;
          return Array.isArray(resData?.data?.data)
            ? resData.data.data
            : (Array.isArray(resData?.data) ? resData.data : (Array.isArray(resData) ? resData : []));
        })
      );
    }
    const restPages = await Promise.all(pagePromises);
    for (const pageList of restPages) {
      rawList.push(...pageList);
    }
  }

  const projects: ProjectRow[] = rawList.map(adaptProjectDto);

  const headers = [
    'Code', 'Nom du projet', 'Bailleur', 'Secteur', 'Pays', 'Chef de Projet',
    'Statut', 'Budget Total', 'Devise', 'Date Début', 'Date Fin Prévue',
    'Progression (%)', 'Profil Qualité (%)', 'Taux Décaissement (%)',
  ];

  const rows = projects.map((p) => [
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

  const csv = '﻿' + [headers, ...rows]
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
