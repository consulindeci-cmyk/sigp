import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface JournalOperation {
  id: string;
  id_journal: string;
  date: string;
  wbs: string;
  description: string;
  ligne_budgetaire: string;
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  prevu: number;
  engage: number;
  decaisse: number;
  ecart: number;
}

export interface JournalData {
  kpis: {
    operationsCount: number;
    prevuTotal: number;
    engageTotal: number;
    decaisseTotal: number;
  };
  operations: JournalOperation[];
}

// ── Ligne Supabase (grand livre `journal_operations`) ─────────────────────────
// NOTE : cette table est un grand livre comptable simple (type/montant/date/
// référence) — elle n'a ni notion de "statut" de workflow, ni de triplet
// prévu/engagé/décaissé par écriture, contrairement à ce que le type
// JournalOperation ci-dessus laisse supposer. `useJournal(projectId)` appelait
// jusqu'ici `/projects/:id/journal`, une route qui n'a JAMAIS existé côté
// NestJS (confirmé par recherche exhaustive) — cet onglet était donc
// silencieusement vide en production. Implémentation réelle ci-dessous,
// branchée sur les vraies écritures, avec un mapping assumé et simplifié :
// - `statut` : toujours TERMINE — un registre Append-Only n'a que des
//   écritures définitives, jamais de workflow en cours.
// - `engage`/`decaisse` : le montant réel de l'écriture pour les DEPENSE
//   (aucune distinction engagement/paiement au niveau de l'écriture — cette
//   distinction existe déjà au niveau agrégé sur budget_lignes, pas ici).
// - `prevu` : 0 — aucune prévision n'est rattachée à une écriture individuelle.
// - `wbs` : code de la ligne budgétaire d'origine (le lien le plus proche
//   disponible, il n'y a pas de rattachement WBS direct sur cette table).

interface JournalOperationRow {
  id: string;
  budget_ligne_id: string;
  type: 'RECETTE' | 'DEPENSE' | 'VIREMENT';
  montant: number;
  date_operation: string;
  reference: string | null;
  description: string | null;
}

function adaptOperation(row: JournalOperationRow, ligne: { code_ligne: string; libelle: string } | undefined): JournalOperation {
  const montant = Number(row.montant);
  const isDepense = row.type === 'DEPENSE';
  return {
    id:               row.id,
    id_journal:       row.reference ?? `OP-${row.id.slice(0, 8).toUpperCase()}`,
    date:             row.date_operation,
    wbs:              ligne?.code_ligne ?? '',
    description:      row.description ?? row.reference ?? `${row.type} — ${ligne?.libelle ?? ''}`.trim(),
    ligne_budgetaire: ligne?.libelle ?? '',
    statut:           'TERMINE',
    prevu:            0,
    engage:           isDepense ? montant : 0,
    decaisse:         isDepense ? montant : 0,
    ecart:            isDepense ? -montant : 0,
  };
}

export const useJournal = (projectId: string) => {
  return useQuery({
    queryKey: ['projects', projectId, 'journal'],
    queryFn: async (): Promise<JournalData | null> => {
      if (!projectId) return null;

      // Étape 1 : lignes budgétaires du projet (via ses versions).
      const { data: lignes, error: lignesError } = await supabase
        .from('budget_lignes')
        .select('id, code_ligne, libelle, version:budget_versions!inner(project_id)')
        .is('deleted_at', null)
        .eq('version.project_id', projectId);
      if (lignesError) throw lignesError;

      const ligneIds = (lignes ?? []).map((l) => l.id);
      const ligneMap = new Map((lignes ?? []).map((l) => [l.id, { code_ligne: l.code_ligne, libelle: l.libelle }]));
      if (ligneIds.length === 0) {
        return { kpis: { operationsCount: 0, prevuTotal: 0, engageTotal: 0, decaisseTotal: 0 }, operations: [] };
      }

      // Étape 2 : écritures du journal pour ces lignes.
      const { data: rows, error: opsError } = await supabase
        .from('journal_operations')
        .select('id, budget_ligne_id, type, montant, date_operation, reference, description')
        .is('deleted_at', null)
        .in('budget_ligne_id', ligneIds)
        .order('date_operation', { ascending: false })
        .limit(200);
      if (opsError) throw opsError;

      const operations = (rows as unknown as JournalOperationRow[]).map((r) => adaptOperation(r, ligneMap.get(r.budget_ligne_id)));

      return {
        kpis: {
          operationsCount: operations.length,
          prevuTotal:    operations.reduce((s, o) => s + o.prevu,    0),
          engageTotal:   operations.reduce((s, o) => s + o.engage,   0),
          decaisseTotal: operations.reduce((s, o) => s + o.decaisse, 0),
        },
        operations,
      };
    },
    enabled: !!projectId,
  });
};
