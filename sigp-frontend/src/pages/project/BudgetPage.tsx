import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useBudget, useBudgetVersion, useBudgetWorkflow } from '@/hooks/useBudget';
import { formatMoney } from '@/utils/format';
import { StatutBudget } from '@/types/budget';
import type { BudgetLigne, BudgetVersion } from '@/types/budget';
import type { LigneHistoryEntry } from '@/components/project/budget/views/BudgetMatrix';
import type { VersionItem } from '@/components/common/workflow/VersionSelector';
import {
  GitCommit, CheckCircle2, AlertCircle, LayoutGrid,
  TrendingUp, Banknote, Loader2, PieChart, Wallet,
  BarChart2, ChevronUp, ChevronDown, ChevronsUpDown, Search, X, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import { BudgetMatrix } from '@/components/project/budget/views/BudgetMatrix';
import { BudgetRevisionsView } from '@/components/project/budget/views/BudgetRevisionsView';
import { BudgetAnalyticsDashboard } from '@/components/project/budget/views/BudgetAnalyticsDashboard';
import { VersionSelector } from '@/components/common/workflow/VersionSelector';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderStatusBadge(statut?: string) {
  switch (statut) {
    case 'APPROUVE':    return <Badge variant="success">Approuvé</Badge>;
    case 'BROUILLON':   return <Badge variant="secondary">Brouillon</Badge>;
    case 'SOUMIS':      return <Badge variant="warning">Soumis</Badge>;
    case 'EN_REVISION': return <Badge variant="destructive">En Révision</Badge>;
    case 'ARCHIVE':     return <Badge variant="secondary">Archivé</Badge>;
    default:            return <Badge variant="outline">{statut ?? 'N/A'}</Badge>;
  }
}

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ErrorView() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-2">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">Erreur de chargement</p>
      <p className="text-xs text-muted-foreground">Impossible de charger le Budget.</p>
    </div>
  );
}

function EmptyBudgetView() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-3 text-muted-foreground">
      <GitCommit className="h-10 w-10 opacity-40" />
      <p className="text-base font-semibold text-foreground">Aucun Budget actif</p>
      <p className="text-sm">Le budget de ce projet n'a pas encore été initialisé.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MatrixContent wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface MatrixContentProps {
  isLoading:        boolean;
  error:            unknown;
  budgetVersion?:   BudgetVersion;
  lignes:           BudgetLigne[];
  lineHistory:      LigneHistoryEntry[];
  onAddLigne:       (data: Partial<BudgetLigne>) => void;
  onEditLigne:      (id: string, data: Partial<BudgetLigne>) => void;
  onDeleteLigne:    (id: string) => void;
  onDuplicateLigne: (id: string) => void;
  onImportLignes:   (lignes: Partial<BudgetLigne>[]) => void;
}

function MatrixContent({
  isLoading, error, budgetVersion,
  lignes, lineHistory,
  onAddLigne, onEditLigne, onDeleteLigne, onDuplicateLigne, onImportLignes,
}: MatrixContentProps) {
  if (isLoading)      return <LoadingView />;
  if (error)          return <ErrorView />;
  if (!budgetVersion) return <EmptyBudgetView />;
  return (
    <BudgetMatrix
      lignes={lignes}
      lineHistory={lineHistory}
      onAddLigne={onAddLigne}
      onEditLigne={onEditLigne}
      onDeleteLigne={onDeleteLigne}
      onDuplicateLigne={onDuplicateLigne}
      onImportLignes={onImportLignes}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FinancementsView — tableau complet avec recherche, tri, indicateurs
// ─────────────────────────────────────────────────────────────────────────────

type SortKey = 'nom' | 'revise' | 'engage' | 'decaisse' | 'disponible' | 'taux';

interface BailleurStats {
  id:         string;
  nom:        string;
  revise:     number;
  engage:     number;
  decaisse:   number;
  disponible: number;
  taux:       number;
  pctPart:    number;
}

function SortIcon({ col, current, asc }: { col: SortKey; current: SortKey; asc: boolean }) {
  if (col !== current) return <ChevronsUpDown className="h-3 w-3 opacity-40 inline-block ml-1" />;
  return asc
    ? <ChevronUp   className="h-3 w-3 text-primary inline-block ml-1" />
    : <ChevronDown className="h-3 w-3 text-primary inline-block ml-1" />;
}

function FinancementsView({ lignes }: { lignes: BudgetLigne[] }) {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('revise');
  const [sortAsc, setSortAsc] = useState(false);

  const byBailleur = useMemo((): BailleurStats[] => {
    const map: Record<string, Omit<BailleurStats, 'taux' | 'pctPart'>> = {};
    for (const l of lignes) {
      const k = l.bailleur_id;
      if (!map[k]) {
        map[k] = { id: k, nom: l.bailleur_nom || l.bailleur_id, revise: 0, engage: 0, decaisse: 0, disponible: 0 };
      }
      map[k].revise     += l.montant_revise;
      map[k].engage     += l.montant_engage;
      map[k].decaisse   += l.montant_decaisse;
      map[k].disponible += l.solde_disponible;
    }
    const totalRevise = Object.values(map).reduce((s, b) => s + b.revise, 0);
    return Object.values(map).map(b => ({
      ...b,
      taux:    b.revise > 0 ? (b.decaisse / b.revise * 100) : 0,
      pctPart: totalRevise > 0 ? (b.revise / totalRevise * 100) : 0,
    }));
  }, [lignes]);

  const totalRevise   = useMemo(() => byBailleur.reduce((s, b) => s + b.revise,   0), [byBailleur]);
  const totalEngage   = useMemo(() => byBailleur.reduce((s, b) => s + b.engage,   0), [byBailleur]);
  const totalDecaisse = useMemo(() => byBailleur.reduce((s, b) => s + b.decaisse, 0), [byBailleur]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return byBailleur
      .filter(b => !q || b.nom.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortKey === 'nom') {
          return sortAsc ? a.nom.localeCompare(b.nom) : b.nom.localeCompare(a.nom);
        }
        const va = a[sortKey];
        const vb = b[sortKey];
        return sortAsc ? va - vb : vb - va;
      });
  }, [byBailleur, search, sortKey, sortAsc]);

  // Totaux calculés uniquement sur les bailleurs visibles (après filtre de recherche)
  const ftRevise     = useMemo(() => filtered.reduce((s, b) => s + b.revise,     0), [filtered]);
  const ftEngage     = useMemo(() => filtered.reduce((s, b) => s + b.engage,     0), [filtered]);
  const ftDecaisse   = useMemo(() => filtered.reduce((s, b) => s + b.decaisse,   0), [filtered]);
  const ftDisponible = useMemo(() => filtered.reduce((s, b) => s + b.disponible, 0), [filtered]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(prev => !prev);
    else { setSortKey(key); setSortAsc(false); }
  }

  const tauxGlobalEngagement  = totalRevise > 0 ? (totalEngage   / totalRevise * 100) : 0;
  const tauxGlobalDecaissement = totalRevise > 0 ? (totalDecaisse / totalRevise * 100) : 0;

  if (lignes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Users className="h-10 w-10 opacity-40" />
        <p className="text-base font-semibold text-foreground">Aucun financement</p>
        <p className="text-sm text-center max-w-sm">
          Ajoutez des lignes budgétaires pour voir la répartition par bailleur.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-5xl mx-auto w-full p-6 flex flex-col gap-6">

        {/* ── KPI summary ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Budget total</p>
            <p className="font-mono text-base font-bold text-foreground">{formatMoney(totalRevise)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Engagé</p>
            <p className="font-mono text-base font-bold text-warning">{formatMoney(totalEngage)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tauxGlobalEngagement.toFixed(1)} %</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Décaissé</p>
            <p className="font-mono text-base font-bold text-success">{formatMoney(totalDecaisse)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{tauxGlobalDecaissement.toFixed(1)} %</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Bailleurs</p>
            <p className="font-mono text-base font-bold text-primary">{byBailleur.length}</p>
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">Répartition par Bailleur</h2>
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un bailleur…"
              className="h-8 text-xs pl-8 pr-7 w-52"
            />
            {search && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')} aria-label="Effacer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {(
                    [
                      { key: 'nom',        label: 'Bailleur',      align: 'left'  },
                      { key: 'revise',     label: 'Budget révisé', align: 'right' },
                      { key: 'engage',     label: 'Engagé',        align: 'right' },
                      { key: 'decaisse',   label: 'Décaissé',      align: 'right' },
                      { key: 'disponible', label: 'Disponible',    align: 'right' },
                      { key: 'taux',       label: 'Taux décais.',  align: 'right' },
                    ] as { key: SortKey; label: string; align: string }[]
                  ).map(col => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap text-${col.align}`}
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon col={col.key} current={sortKey} asc={sortAsc} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left">Part / Progression</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      Aucun bailleur ne correspond à la recherche.
                    </td>
                  </tr>
                ) : (
                  filtered.map(b => {
                    const pctEng = b.revise > 0 ? (b.engage   / b.revise * 100) : 0;
                    const pctDec = b.revise > 0 ? (b.decaisse / b.revise * 100) : 0;

                    return (
                      <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-sm text-foreground">{b.nom}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Part du budget : <span className="font-medium">{b.pctPart.toFixed(1)} %</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-foreground">{formatMoney(b.revise)}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-warning">
                          {formatMoney(b.engage)}
                          <div className="text-[10px] text-muted-foreground">{pctEng.toFixed(1)} %</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-success">
                          {formatMoney(b.decaisse)}
                          <div className="text-[10px] text-muted-foreground">{pctDec.toFixed(1)} %</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-primary">{formatMoney(b.disponible)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-bold ${b.taux >= 50 ? 'text-success' : b.taux >= 25 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {b.taux.toFixed(1)} %
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>Engagé</span><span>{pctEng.toFixed(0)} %</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-warning/60 rounded-full relative"
                                style={{ width: `${Math.min(pctEng, 100)}%` }}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-success rounded-full"
                                  style={{ width: pctEng > 0 ? `${Math.min(pctDec / pctEng * 100, 100)}%` : '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Totals row — calculés sur les bailleurs filtrés uniquement */}
              {filtered.length > 0 && (() => {
                const ftTauxEng = ftRevise > 0 ? (ftEngage   / ftRevise * 100) : 0;
                const ftTauxDec = ftRevise > 0 ? (ftDecaisse / ftRevise * 100) : 0;
                return (
                  <tfoot>
                    <tr className="bg-muted/30 border-t-2 border-border font-bold">
                      <td className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">
                        TOTAL ({filtered.length} bailleur{filtered.length > 1 ? 's' : ''})
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">{formatMoney(ftRevise)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-warning">{formatMoney(ftEngage)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-success">{formatMoney(ftDecaisse)}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-primary">{formatMoney(ftDisponible)}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                        {ftTauxDec.toFixed(1)} %
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-warning/60 rounded-full relative" style={{ width: `${Math.min(ftTauxEng, 100)}%` }}>
                            <div className="absolute inset-y-0 left-0 bg-success rounded-full" style={{ width: ftTauxEng > 0 ? `${Math.min(ftTauxDec / ftTauxEng * 100, 100)}%` : '0%' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unique ID generator
// ─────────────────────────────────────────────────────────────────────────────

function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BudgetPage
// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId }  = useUIStore();
  const resolvedProjectId    = urlProjectId || activeProjectId || '';

  // Empty string → hook returns active version (v2.0 in mock)
  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('');

  const { data: budget, isLoading: isLoadingBudget, error: errorBudget } = useBudget(resolvedProjectId);
  const { data: budgetVersion, isLoading: isLoadingVersion } = useBudgetVersion(resolvedProjectId, versionSelectionnee);
  const workflowMutation = useBudgetWorkflow(resolvedProjectId);

  const isLoading = isLoadingBudget || isLoadingVersion;
  const error     = errorBudget;

  // ── Local state for CRUD ──────────────────────────────────────────────────
  const [localLignes,  setLocalLignes]  = useState<BudgetLigne[]>([]);
  const [localStatut,  setLocalStatut]  = useState<StatutBudget>(StatutBudget.BROUILLON);
  const [lineHistory,  setLineHistory]  = useState<LigneHistoryEntry[]>([]);

  // Sync from hook when version changes
  useEffect(() => {
    if (budgetVersion) {
      setLocalLignes(budgetVersion.lignes ?? []);
      setLocalStatut(budgetVersion.statut);
    }
  }, [budgetVersion?.id]);

  // Set active version once budget loads
  useEffect(() => {
    if (budget?.version_active_id && !versionSelectionnee) {
      setVersionSelectionnee(budget.version_active_id);
    }
  }, [budget?.version_active_id, versionSelectionnee]);

  // Clear history when version changes
  useEffect(() => {
    setLineHistory([]);
  }, [budgetVersion?.id]);

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher son Budget.
        </p>
      </div>
    );
  }

  // ── Version items (dynamic from budget.versions) ──────────────────────────
  const versionItems = useMemo((): VersionItem[] => {
    if (!budget?.versions?.length) return [];
    const STATUT_LABELS: Record<StatutBudget, string> = {
      [StatutBudget.BROUILLON]:   'Brouillon',
      [StatutBudget.SOUMIS]:      'Soumis',
      [StatutBudget.EN_REVISION]: 'En révision',
      [StatutBudget.APPROUVE]:    'Approuvé',
      [StatutBudget.ARCHIVE]:     'Archivé',
    };
    return budget.versions.map(v => ({
      id:          v.id,
      label:       v.numero_version,
      description: STATUT_LABELS[v.statut] ?? v.statut,
      isActive:    v.id === budget.version_active_id,
      statut:      v.statut,
    }));
  }, [budget]);

  // ── Workflow ──────────────────────────────────────────────────────────────
  function handleActionWorkflow(action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') {
    let newStatut = localStatut;
    if (action === 'SOUMETTRE') newStatut = StatutBudget.SOUMIS;
    if (action === 'APPROUVER') newStatut = StatutBudget.APPROUVE;
    if (action === 'REJETER')   newStatut = StatutBudget.BROUILLON;
    setLocalStatut(newStatut);
    if (budget) {
      workflowMutation.mutate({
        budgetId:      budget.id,
        versionId:     versionSelectionnee,
        nouveauStatut: newStatut,
        commentaire:   `Action : ${action}`,
      });
    }
  }

  // ── CRUD + history tracking ───────────────────────────────────────────────

  function handleAddLigne(data: Partial<BudgetLigne>) {
    const id = uid('l');
    const newLigne: BudgetLigne = {
      id,
      budget_version_id:     budgetVersion?.id ?? 'local',
      version:               1,
      wbs_id:                data.wbs_id                || uid('wbs'),
      wbs_nom:               data.wbs_nom,
      bailleur_id:           data.bailleur_id           || '',
      bailleur_nom:          data.bailleur_nom,
      source_financement_id: data.source_financement_id || 'PRET',
      categorie_id:          data.categorie_id          || '',
      compte_comptable_id:   data.compte_comptable_id,
      montant_initial:       data.montant_initial       ?? 0,
      montant_revise:        data.montant_revise        ?? 0,
      montant_pre_engage:    data.montant_pre_engage    ?? 0,
      montant_engage:        data.montant_engage        ?? 0,
      montant_liquide:       data.montant_liquide       ?? 0,
      montant_decaisse:      data.montant_decaisse      ?? 0,
      solde_disponible:      data.solde_disponible      ?? 0,
      reste_a_payer:         data.reste_a_payer         ?? 0,
    };
    setLocalLignes(prev => [...prev, newLigne]);
    setLineHistory(prev => [...prev, {
      id:      uid('h'),
      ligneId: id,
      action:  'CREATION',
      date:    new Date().toISOString(),
      user:    'Utilisateur',
      after:   newLigne,
    }]);
  }

  function handleEditLigne(id: string, data: Partial<BudgetLigne>) {
    const before = localLignes.find(l => l.id === id);
    setLocalLignes(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated: BudgetLigne = { ...l, ...data };
      updated.solde_disponible = Math.max(0, updated.montant_revise - updated.montant_pre_engage - updated.montant_engage);
      updated.reste_a_payer    = Math.max(0, updated.montant_engage - updated.montant_decaisse);
      return updated;
    }));
    setLineHistory(prev => [...prev, {
      id:      uid('h'),
      ligneId: id,
      action:  'MODIFICATION',
      date:    new Date().toISOString(),
      user:    'Utilisateur',
      before,
      after:   data,
    }]);
  }

  function handleDeleteLigne(id: string) {
    const deleted = localLignes.find(l => l.id === id);
    setLocalLignes(prev => prev.filter(l => l.id !== id));
    setLineHistory(prev => [...prev, {
      id:      uid('h'),
      ligneId: id,
      action:  'SUPPRESSION',
      date:    new Date().toISOString(),
      user:    'Utilisateur',
      comment: deleted ? `Ligne "${deleted.wbs_nom || deleted.wbs_id}" supprimée` : undefined,
      before:  deleted,
    }]);
  }

  function handleDuplicateLigne(id: string) {
    const source = localLignes.find(l => l.id === id);
    if (!source) return;
    const newId = uid('l');
    const duplicate: BudgetLigne = {
      ...source,
      id:      newId,
      wbs_nom: source.wbs_nom ? `${source.wbs_nom} (copie)` : undefined,
      wbs_id:  `${source.wbs_id}-copy`,
    };
    setLocalLignes(prev => {
      const idx  = prev.findIndex(l => l.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, duplicate);
      return next;
    });
    setLineHistory(prev => [...prev, {
      id:      uid('h'),
      ligneId: newId,
      action:  'DUPLICATION',
      date:    new Date().toISOString(),
      user:    'Utilisateur',
      comment: `Dupliqué depuis "${source.wbs_nom || source.wbs_id}"`,
      after:   duplicate,
    }]);
  }

  function handleImportLignes(newLignes: Partial<BudgetLigne>[]) {
    const created: BudgetLigne[] = newLignes.map((data, i) => {
      const id = uid(`l-imp-${i}`);
      return {
        id,
        budget_version_id:     budgetVersion?.id ?? 'local',
        version:               1,
        wbs_id:                data.wbs_id                || uid('wbs'),
        wbs_nom:               data.wbs_nom,
        bailleur_id:           data.bailleur_id           || '',
        bailleur_nom:          data.bailleur_nom,
        source_financement_id: data.source_financement_id || 'PRET',
        categorie_id:          data.categorie_id          || '',
        compte_comptable_id:   data.compte_comptable_id,
        montant_initial:       data.montant_initial       ?? 0,
        montant_revise:        data.montant_revise        ?? 0,
        montant_pre_engage:    data.montant_pre_engage    ?? 0,
        montant_engage:        data.montant_engage        ?? 0,
        montant_liquide:       data.montant_liquide       ?? 0,
        montant_decaisse:      data.montant_decaisse      ?? 0,
        solde_disponible:      data.solde_disponible      ?? 0,
        reste_a_payer:         data.reste_a_payer         ?? 0,
      };
    });
    setLocalLignes(prev => [...prev, ...created]);
    setLineHistory(prev => [
      ...prev,
      ...created.map(l => ({
        id:      uid('h'),
        ligneId: l.id,
        action:  'CREATION' as const,
        date:    new Date().toISOString(),
        user:    'Import Excel',
        comment: `Importé depuis fichier Excel`,
        after:   l,
      })),
    ]);
  }

  // ── KPIs from local state ─────────────────────────────────────────────────
  const totalBAC        = useMemo(() => localLignes.reduce((s, l) => s + l.montant_revise,     0), [localLignes]);
  const totalPreEngage  = useMemo(() => localLignes.reduce((s, l) => s + l.montant_pre_engage, 0), [localLignes]);
  const totalEngage     = useMemo(() => localLignes.reduce((s, l) => s + l.montant_engage,     0), [localLignes]);
  const totalDecaisse   = useMemo(() => localLignes.reduce((s, l) => s + l.montant_decaisse,   0), [localLignes]);
  const totalDisponible = useMemo(() => localLignes.reduce((s, l) => s + l.solde_disponible,   0), [localLignes]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <PageHeader title="Budget &amp; Suivi Financier" />
            {renderStatusBadge(localStatut)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivi de l'exécution financière · version {budgetVersion?.numero_version || '—'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {versionItems.length > 0 && (
            <VersionSelector
              versions={versionItems}
              selectedId={versionSelectionnee}
              onChange={setVersionSelectionnee}
            />
          )}

          {localStatut === StatutBudget.BROUILLON && (
            <Button
              size="sm" variant="default"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => handleActionWorkflow('SOUMETTRE')}
              disabled={workflowMutation.isPending}
            >
              Soumettre
            </Button>
          )}

          {localStatut === StatutBudget.SOUMIS && (
            <>
              <Button
                size="sm" variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleActionWorkflow('REJETER')}
                disabled={workflowMutation.isPending}
              >
                Rejeter
              </Button>
              <Button
                size="sm" variant="default"
                className="bg-success hover:bg-success/90 text-success-foreground"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleActionWorkflow('APPROUVER')}
                disabled={workflowMutation.isPending}
              >
                Approuver
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-4 border-b border-border bg-muted/10">
        <StatCard
          title="Budget Révisé (BAC)"
          value={formatMoney(totalBAC)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
          iconVariant="primary"
        />
        <StatCard
          title="Pré-engagements"
          value={formatMoney(totalPreEngage)}
          icon={<TrendingUp className="h-4 w-4 text-warning" />}
          iconVariant="warning"
        />
        <StatCard
          title="Engagements (Contrats)"
          value={formatMoney(totalEngage)}
          icon={<LayoutGrid className="h-4 w-4 text-warning" />}
          iconVariant="warning"
        />
        <StatCard
          title="Décaissements"
          value={formatMoney(totalDecaisse)}
          icon={<CheckCircle2 className="h-4 w-4 text-success" />}
          iconVariant="success"
        />
        <StatCard
          title="Solde Disponible"
          value={formatMoney(totalDisponible)}
          icon={<Banknote className="h-4 w-4 text-info" />}
          iconVariant="info"
        />
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="matrix" className="flex flex-col flex-1 min-h-0 p-4 gap-0">
        <TabsList className="shrink-0 self-start mb-3 h-auto gap-0.5 max-w-full overflow-x-auto flex-nowrap justify-start scrollbar-thin">
          <TabsTrigger value="matrix" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" />
            Matrice Globale
          </TabsTrigger>
          <TabsTrigger value="finances" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart2 className="h-3.5 w-3.5" />
            Financements
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <GitCommit className="h-3.5 w-3.5" />
            Révisions
          </TabsTrigger>
          <TabsTrigger value="bi" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <PieChart className="h-3.5 w-3.5" />
            Dashboard BI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="flex-1 min-h-0 overflow-hidden mt-0">
          <MatrixContent
            isLoading={isLoading}
            error={error}
            budgetVersion={budgetVersion}
            lignes={localLignes}
            lineHistory={lineHistory}
            onAddLigne={handleAddLigne}
            onEditLigne={handleEditLigne}
            onDeleteLigne={handleDeleteLigne}
            onDuplicateLigne={handleDuplicateLigne}
            onImportLignes={handleImportLignes}
          />
        </TabsContent>

        <TabsContent value="finances" className="flex-1 min-h-0 overflow-hidden mt-0">
          {isLoading
            ? <LoadingView />
            : <FinancementsView lignes={localLignes} />
          }
        </TabsContent>

        <TabsContent value="revisions" className="flex-1 min-h-0 overflow-hidden mt-0">
          {budgetVersion
            ? <BudgetRevisionsView budgetVersion={budgetVersion} />
            : <EmptyBudgetView />
          }
        </TabsContent>

        <TabsContent value="bi" className="flex-1 min-h-0 overflow-hidden mt-0">
          {budgetVersion
            ? <BudgetAnalyticsDashboard budgetVersion={budgetVersion} lignes={localLignes} />
            : <EmptyBudgetView />
          }
        </TabsContent>
      </Tabs>

    </div>
  );
}
