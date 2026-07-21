import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { HistoriqueProjet, ModuleHistorique, PaginatedResponse, TypeActionHistorique } from '@/types';

// ── Ligne Supabase (table `historique`, écrite par toutes les Edge Functions) ─
// NOTE : useHistory(projectId) appelait jusqu'ici `/projects/:id/history`, une
// route qui n'a JAMAIS existé côté NestJS (le vrai contrôleur expose `GET
// /history?projectId=` à plat) — cet onglet était donc silencieusement vide.
// Implémentation réelle ci-dessous, avec un mapping assumé et documenté :
// - `element` : dérivé génériquement du JSON `apres`/`avant` déjà stocké par
//   chaque Edge Function (premier champ code/nom/libelle/titre/intitule/
//   numero trouvé), plutôt que de recoder un lookup par table (~20 tables
//   possibles) — fallback sur `table_cible#id` si aucun champ ne matche.
// - `niveau` : aucune notion de gravité n'existe sur cette table — approximé
//   à partir de l'action (DELETE/REJECT → AVERTISSEMENT, sinon INFO).
// - `role`/`utilisateur` : résolus via une jointure sur `users`.
// - `ip`/`navigateur` : mappés depuis `ip_address`/`user_agent`, mais AUCUNE
//   Edge Function ne renseigne jamais ces deux colonnes à l'insertion —
//   elles sont donc toujours vides en pratique. Champs conservés dans le
//   type adapté pour ne pas casser la forme de HistoriqueProjet, mais
//   volontairement absents de l'UI (cf. HistorySlideOver.tsx) tant qu'aucune
//   Edge Function ne les alimente réellement.

interface HistoriqueRow {
  id: string;
  project_id: string | null;
  user_id: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VALIDATE' | 'REJECT';
  table_cible: string;
  enregistrement_id: string | null;
  avant: Record<string, unknown> | null;
  apres: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: { nom: string; prenom: string; role: string } | { nom: string; prenom: string; role: string }[] | null;
}

const HISTORIQUE_SELECT = `
  id, project_id, user_id, action, table_cible, enregistrement_id, avant, apres,
  ip_address, user_agent, created_at, user:users(nom, prenom, role)
`;

const ACTION_MAP: Record<HistoriqueRow['action'], TypeActionHistorique> = {
  CREATE: 'CREATION',
  UPDATE: 'MODIFICATION',
  DELETE: 'SUPPRESSION',
  LOGIN: 'CONNEXION',
  LOGOUT: 'DECONNEXION',
  EXPORT: 'EXPORT',
  VALIDATE: 'VALIDATION',
  REJECT: 'REJET',
};

// table_cible (nom de table Postgres) → module d'affichage. Toute table non
// listée retombe sur "Paramètres" (bucket générique, pas d'entrée dédiée dans
// ModuleHistorique pour WBS/Logframe/Users/Notifications).
const MODULE_MAP: Record<string, ModuleHistorique> = {
  projects: 'Projet',
  ptba_activites: 'PTBA',
  budget_versions: 'Budget',
  budget_lignes: 'Budget',
  funding_sources: 'Sources',
  ppm_marches: 'PPM',
  ppm_etapes: 'PPM',
  contracts: 'Contrats',
  disbursements: 'Décaissements',
  evm_snapshots: 'EVM',
  risques: 'Risques',
  livrables: 'Livrables',
  documents_projet: 'Documents',
  rapports_projet: 'Rapports',
};

function deriveModule(tableCible: string): ModuleHistorique {
  return MODULE_MAP[tableCible] ?? 'Paramètres';
}

function deriveNiveau(action: HistoriqueRow['action']): 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE' {
  if (action === 'DELETE' || action === 'REJECT') return 'AVERTISSEMENT';
  return 'INFO';
}

const ELEMENT_FIELD_CANDIDATES = ['code', 'nom', 'libelle', 'titre', 'intitule', 'numero'];

function deriveElement(row: HistoriqueRow): string {
  const snapshot = row.apres ?? row.avant;
  if (snapshot) {
    for (const field of ELEMENT_FIELD_CANDIDATES) {
      const val = snapshot[field];
      if (typeof val === 'string' && val.trim()) return val;
    }
  }
  const shortId = row.enregistrement_id ? row.enregistrement_id.slice(0, 8) : '—';
  return `${deriveModule(row.table_cible)} #${shortId}`;
}

function adaptRow(row: HistoriqueRow): HistoriqueProjet {
  const user = Array.isArray(row.user) ? row.user[0] : row.user;
  const created = new Date(row.created_at);
  const action = ACTION_MAP[row.action] ?? 'MODIFICATION';

  return {
    id: row.id,
    projet_id: row.project_id ?? '',
    date: row.created_at.slice(0, 10),
    heure: created.toISOString().slice(11, 19),
    utilisateur: user ? `${user.prenom} ${user.nom}`.trim() : 'Système',
    role: user?.role ?? '',
    module: deriveModule(row.table_cible),
    element: deriveElement(row),
    action,
    description: `${action === 'CREATION' ? 'Création' : action === 'SUPPRESSION' ? 'Suppression' : action === 'MODIFICATION' ? 'Modification' : action} — ${row.table_cible}`,
    niveau: deriveNiveau(row.action),
    ip: row.ip_address ?? '',
    navigateur: row.user_agent ?? '',
    avant: row.avant,
    apres: row.apres,
    createdAt: row.created_at,
  };
}

export function useHistory(projectId: string) {
  return useQuery({
    queryKey: ['history', projectId],
    queryFn: async (): Promise<PaginatedResponse<HistoriqueProjet>> => {
      const { data, error, count } = await supabase
        .from('historique')
        .select(HISTORIQUE_SELECT, { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      const list = (data as unknown as HistoriqueRow[]).map(adaptRow);
      const total = count ?? list.length;
      return { data: list, meta: { total, page: 1, limit: 200, totalPages: 1 } };
    },
    enabled: !!projectId,
  });
}

export interface HistoryStats {
  total:        number;
  aujourd_hui:  number;
  cette_semaine: number;
  exports:      number;
  alertes:      number;
}

export function useHistoryStats(entries: HistoriqueProjet[]): HistoryStats {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const weekStart = (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().slice(0, 10);
    })();

    const today_count   = entries.filter(e => e.date === today).length;
    const week_count    = entries.filter(e => e.date >= weekStart).length;
    const exports_count = entries.filter(e =>
      e.action === 'EXPORT' || e.action === 'TELECHARGEMENT',
    ).length;
    const alertes_count = entries.filter(e =>
      e.niveau === 'CRITIQUE' || e.niveau === 'AVERTISSEMENT',
    ).length;

    return {
      total:         entries.length,
      aujourd_hui:   today_count,
      cette_semaine: week_count,
      exports:       exports_count,
      alertes:       alertes_count,
    };
  }, [entries]);
}
