import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Calendar, ListTree, CheckCircle2, AlertCircle,
  LayoutGrid, TrendingUp, Loader2, Flame, Banknote, Wallet, Plus, Trash2,
} from 'lucide-react';
import {
  usePTBA, usePtbaActivite, useCreatePtbaActivite, useUpdatePtbaActivite, useDeletePtbaActivite,
} from '@/hooks/usePTBA';
import { useTasks } from '@/hooks/useTasks';
import { useWBS } from '@/hooks/useWBS';
import { useOrganisationMembersForPicker } from '@/hooks/useGovernance';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { type Activity, type ActivityStatus } from '@/mocks/activitiesMocks';
import type { Tache } from '@/types';

const STATUT_TO_ACTIVITY: Record<string, ActivityStatus> = {
  A_FAIRE: 'Non démarré', EN_COURS: 'En cours', TERMINE: 'Terminé',
  ANNULE: 'Suspendu', EN_ATTENTE: 'Non démarré',
};

function adaptTache(t: Tache): Activity {
  const parts = (t.responsable ?? '').split(' ');
  const initiales = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (t.responsable ?? '??').slice(0, 2).toUpperCase();
  return {
    id: t.id, code: t.code_tache, libelle: t.description, description: t.description,
    responsable: t.responsable ?? '—', responsableId: t.responsableId ?? null, initialesResponsable: initiales,
    dateDebut: t.date_debut ?? '', dateFin: t.date_fin ?? '', avancement: t.avancement,
    priorite: 'Moyenne', statut: STATUT_TO_ACTIVITY[t.statut] ?? 'Non démarré',
    composante: '', budgetAlloue: parseFloat(t.cout_prevu) || 0, budgetRealise: parseFloat(t.cout_reel) || 0,
  };
}
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/navigation/Tabs';
import PTBAMatrix from '@/components/project/ptba/views/PTBAMatrix';
import { PTBACalendarView } from '@/components/project/ptba/views/PTBACalendarView';
import { PTBAGanttView } from '@/components/project/ptba/views/PTBAGanttView';
import { PTBAActiviteForm, type PTBAActiviteFormPayload } from '@/components/project/ptba/PTBAActiviteForm';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter,
} from '@/components/ui/overlays/Modal';
import * as XLSX from 'xlsx';
import type { PTBA } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderStatusBadge(statut?: string) {
  switch (statut) {
    case 'APPROUVE':       return <Badge variant="success">Approuvé</Badge>;
    case 'BROUILLON':      return <Badge variant="secondary">Brouillon</Badge>;
    case 'EN_PREPARATION': return <Badge variant="info">En préparation</Badge>;
    case 'SOUMIS':         return <Badge variant="warning">Soumis</Badge>;
    case 'EN_REVISION':    return <Badge variant="destructive">En Révision</Badge>;
    case 'ARCHIVE':        return <Badge variant="secondary">Archivé</Badge>;
    case 'REJETE':         return <Badge variant="destructive">Rejeté</Badge>;
    default:               return <Badge variant="outline">{statut ?? 'N/A'}</Badge>;
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
      <p className="text-xs text-muted-foreground">Impossible de charger le PTBA.</p>
    </div>
  );
}

function EmptyPTBAView({ annee }: { annee: number }) {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-4 text-muted-foreground">
      <Calendar className="h-12 w-12 opacity-30" />
      <div className="text-center">
        <p className="text-base font-semibold text-foreground">Aucun PTBA pour {annee}</p>
        <p className="text-sm mt-1">Aucun plan n'a encore été généré pour cette année.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S-Curve mini widget
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_KEYS = [
  'm1_montant', 'm2_montant', 'm3_montant', 'm4_montant',
  'm5_montant', 'm6_montant', 'm7_montant', 'm8_montant',
  'm9_montant', 'm10_montant', 'm11_montant', 'm12_montant',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap mini widget
// ─────────────────────────────────────────────────────────────────────────────

function HeatmapWidget({ ptba }: { ptba: PTBA }) {
  const lignes = ptba.lignes ?? [];
  const monthly = MONTH_KEYS.map(k => lignes.reduce((s, l) => s + l[k], 0));
  const maxMonthly = Math.max(...monthly, 1);
  const density = monthly.map(v => v / maxMonthly);
  return (
    <Card className="flex-1 min-w-[160px]" role="figure" aria-label="Heatmap densité activité mensuelle">
      <CardContent className="pt-3 pb-2 h-full flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          <Flame className="h-3 w-3" />
          Densité mensuelle
        </div>
        <div className="flex-1 grid grid-cols-12 gap-[2px] items-center min-h-[36px]">
          {density.map((op, i) => (
            <div
              key={i}
              className="aspect-square bg-warning rounded-sm"
              style={{ opacity: Math.max(0.08, op) }}
              title={`Mois ${i + 1}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Matrix ribbon toolbar
// ─────────────────────────────────────────────────────────────────────────────

function MatrixRibbon({ ptba, canManage, onNewActivite, wbsLabels }: { ptba: PTBA; canManage: boolean; onNewActivite: () => void; wbsLabels: Record<string, string> }) {
  function handleExportXlsx() {
    const lignes = ptba.lignes ?? [];
    const HEADERS = [
      'Activité', 'WBS', 'Bailleur', 'Budget Total',
      'Q1', 'Jan', 'Fév', 'Mar',
      'Q2', 'Avr', 'Mai', 'Juin',
      'Q3', 'Juil', 'Août', 'Sept',
      'Q4', 'Oct', 'Nov', 'Déc',
      'Engagé', 'Décaissé', 'Progression %',
    ];
    const rows = lignes.map(l => [
      // Code WBS lisible (ex: "1.1"), pas l'UUID brut — cohérent avec la
      // colonne "Code WBS" affichée à l'écran dans la Matrice (cf. audit).
      l.activite_nom, (l.wbs_id && wbsLabels[l.wbs_id]) || l.wbs_id, l.bailleur_id ?? '', l.montant_total,
      l.q1_montant, l.m1_montant, l.m2_montant, l.m3_montant,
      l.q2_montant, l.m4_montant, l.m5_montant, l.m6_montant,
      l.q3_montant, l.m7_montant, l.m8_montant, l.m9_montant,
      l.q4_montant, l.m10_montant, l.m11_montant, l.m12_montant,
      l.montant_engage, l.montant_decaisse, l.progression_physique,
    ]);
    const totalRow = [
      'TOTAL', '', '', lignes.reduce((s, l) => s + l.montant_total, 0),
      lignes.reduce((s, l) => s + l.q1_montant, 0), 0, 0, 0,
      lignes.reduce((s, l) => s + l.q2_montant, 0), 0, 0, 0,
      lignes.reduce((s, l) => s + l.q3_montant, 0), 0, 0, 0,
      lignes.reduce((s, l) => s + l.q4_montant, 0), 0, 0, 0,
      lignes.reduce((s, l) => s + l.montant_engage, 0),
      lignes.reduce((s, l) => s + l.montant_decaisse, 0),
      '',
    ];
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows, totalRow]);
    ws['!cols'] = [
      { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
      ...Array(19).fill({ wch: 10 }),
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `PTBA ${ptba.annee}`);
    XLSX.writeFile(wb, `ptba-${ptba.annee}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border flex-wrap">
      {canManage && (
        <Button
          variant="default"
          size="sm"
          onClick={onNewActivite}
          leftIcon={<Plus className="h-3 w-3" />}
          className="text-xs h-7 px-2.5"
        >
          Nouvelle activité
        </Button>
      )}
      <div className="w-px h-5 bg-border mx-0.5" />
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportXlsx}
        leftIcon={<FileText className="h-3 w-3" />}
        className="text-xs h-7 px-2.5"
      >
        Exporter XLSX
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PTBAPage
// ─────────────────────────────────────────────────────────────────────────────

export default function PTBAPage() {
  const { id: urlProjectId } = useParams();
  const { activeProjectId } = useUIStore();
  const resolvedProjectId = urlProjectId || activeProjectId || '';

  const [annee, setAnnee] = useState<number>(new Date().getFullYear());

  const { data: ptbaResponse, isLoading, error } = usePTBA(resolvedProjectId, annee);

  const { data: tasksData } = useTasks(resolvedProjectId, { annee });
  const activities: Activity[] = ((tasksData as { data?: Tache[] })?.data
    ?? (Array.isArray(tasksData) ? tasksData as Tache[] : [])
  ).map(adaptTache);

  // Miroir de requireRole(profile, [...]) sur ptba-update — la saisie inline
  // de la matrice (cf. audit Rôles) doit être bloquée pour VIEWER/AUDITEUR.
  const currentRole = useAuthStore(s => s.user?.role);
  const canEditPtba = !!currentRole && ['COORDINATEUR', 'CHARGE_PROGRAMME', 'ADMIN', 'SUPER_ADMIN'].includes(currentRole);
  const canDeletePtba = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  // La Matrice est en lecture seule (cf. audit PTBA) : plus besoin de miroir
  // d'état local ici, `ptba` reflète directement les données du serveur.
  const ptba = ptbaResponse?.data ?? null;

  // ── CRUD activité (formulaire réel — cf. audit Cadre Logique/PTBA :
  // l'édition inline de la matrice ne persiste rien, aucune UI n'existait
  // pour créer/éditer une activité ni choisir son indicateur lié) ──────────
  const createActiviteMutation = useCreatePtbaActivite(resolvedProjectId, annee);
  const updateActiviteMutation = useUpdatePtbaActivite(resolvedProjectId, annee);
  const deleteActiviteMutation = useDeletePtbaActivite(resolvedProjectId, annee);

  const [isActiviteFormOpen, setIsActiviteFormOpen] = useState(false);
  const [editingActiviteId, setEditingActiviteId] = useState<string | null>(null);
  const [activiteFormError, setActiviteFormError] = useState<string | null>(null);
  const { data: editingActiviteData } = usePtbaActivite(editingActiviteId ?? '');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Résolution des UUID bruts (wbs_id / responsable_id) affichés jusqu'ici
  // tels quels dans la matrice. wbsLabels ne porte que le code du nœud
  // (ex: "1.1") — colonne dédiée "Code WBS", cf. alignement Excel. Le
  // rattachement Indicateur IOV reste sélectionnable dans le formulaire mais
  // n'est plus affiché en colonne (hors périmètre du modèle Excel).
  const { data: wbsData } = useWBS(resolvedProjectId);
  const { data: orgMembers = [] } = useOrganisationMembersForPicker(resolvedProjectId);

  const wbsLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of wbsData?.data ?? []) map[n.id] = n.code_wbs;
    return map;
  }, [wbsData?.data]);

  const responsableLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of orgMembers) map[m.id] = m.displayName;
    return map;
  }, [orgMembers]);

  const extractErrorMessage = (err: unknown): string =>
    err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';

  const handleNewActivite = () => {
    setEditingActiviteId(null);
    setActiviteFormError(null);
    setIsActiviteFormOpen(true);
  };

  const handleEditActivite = (id: string) => {
    setEditingActiviteId(id);
    setActiviteFormError(null);
    setIsActiviteFormOpen(true);
  };

  const handleActiviteFormSubmit = (payload: PTBAActiviteFormPayload) => {
    setActiviteFormError(null);
    const onSuccess = () => { setIsActiviteFormOpen(false); setEditingActiviteId(null); };
    const onError = (err: unknown) => setActiviteFormError(extractErrorMessage(err));
    if (editingActiviteId) {
      const { code: _code, ...updatePayload } = payload;
      updateActiviteMutation.mutate({ id: editingActiviteId, ...updatePayload }, { onSuccess, onError });
    } else {
      createActiviteMutation.mutate({ projectId: resolvedProjectId, ...payload, code: payload.code ?? '' }, { onSuccess, onError });
    }
  };

  const handleDeleteActiviteRequest = (id: string) => {
    setDeleteError(null);
    setDeleteTargetId(id);
  };

  const handleDeleteActiviteConfirm = () => {
    if (!deleteTargetId) return;
    setDeleteError(null);
    deleteActiviteMutation.mutate(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
      onError: (err) => setDeleteError(extractErrorMessage(err)),
    });
  };

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Aucun projet sélectionné</h2>
        <p className="text-sm text-muted-foreground">
          Veuillez sélectionner un projet pour afficher son PTBA.
        </p>
      </div>
    );
  }

  // KPIs (réel-time via localPtba)
  const totalBudget = ptba?.budget_total || 0;

  // Plafond bailleur global du projet — somme des enveloppe_cible des
  // composantes racine WBS (cf. Enveloppe Bailleur, WBSNodeForm). Phase de
  // planification : Engagements/Décaissements/Taux Absorption restent à 0
  // tant qu'aucun décaissement réel n'existe — remplacés ici par une vue
  // synthétique plafond vs. planifié, plus utile à ce stade du projet.
  const rootWbsNodes = (wbsData?.data ?? []).filter(n => !n.parent_id && n.enveloppe_cible != null);
  const plafondGlobal = rootWbsNodes.reduce((s, n) => s + (n.enveloppe_cible ?? 0), 0);
  const hasPlafondGlobal = rootWbsNodes.length > 0;
  const resteAPlanifier = plafondGlobal - totalBudget;
  const isPlafondDepasse = hasPlafondGlobal && resteAPlanifier < 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <PageHeader title={`PTBA ${annee}`} />
            {ptba && renderStatusBadge(ptba.statut)}
          </div>

        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            wrapperClassName="w-auto"
            className="h-8 text-xs"
            value={String(annee)}
            onChange={e => setAnnee(Number(e.target.value))}
            aria-label="Sélectionner l'année d'exercice"
          >
            <option value="2024">Ex 2024</option>
            <option value="2025">Ex 2025</option>
            <option value="2026">Ex 2026</option>
          </Select>

          {/* Désactivés (audit d'intégrité) : il n'existe aucune entité PTBA
              versionnée ni statut de validation réel en base — cliquer
              Soumettre/Approuver/Rejeter écrasait le statut individuel de
              TOUTES les activités de l'année avec une seule valeur dérivée de
              l'action, sans confirmation ni notification. Réactiver une fois
              un vrai modèle de workflow PTBA conçu. */}
          {ptba?.statut === 'BROUILLON' && (
            <Button
              size="sm"
              variant="default"
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              disabled
              title="Workflow de validation PTBA pas encore implémenté"
              className="h-8 text-xs"
            >
              Soumettre
            </Button>
          )}

        </div>
      </div>

      {/* ── CONDITIONAL BODY ──────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView />
      ) : !ptba ? (
        <EmptyPTBAView annee={annee} />
      ) : (
        <>

          {/* ── KPI STRIP + WIDGETS ─────────────────────────────────────── */}
          <div className="shrink-0 flex flex-wrap gap-3 px-4 py-3 border-b border-border bg-muted/10 items-stretch">

            {/* KPI StatCards — phase de planification : Budget Planifié + vue
                synthétique Plafond Global / Reste à planifier, à la place des
                cartes d'exécution (Engagements/Décaissements/Absorption)
                systématiquement à 0 tant qu'aucun décaissement réel n'existe. */}
            <div className="flex-1 min-w-[280px] grid grid-cols-2 gap-3">
              <StatCard
                title="Budget Planifié"
                value={formatMoney(totalBudget)}
                icon={<Wallet className="h-4 w-4 text-primary" />}
                iconVariant="primary"
              />
              <StatCard
                title="Plafond Global (Bailleur)"
                value={hasPlafondGlobal ? formatMoney(plafondGlobal) : 'Non défini'}
                icon={<Banknote className="h-4 w-4 text-secondary-foreground" />}
                iconVariant="default"
                description="Somme des enveloppes cibles WBS"
              />
              <StatCard
                title={isPlafondDepasse ? 'Dépassement' : 'Reste à planifier'}
                value={hasPlafondGlobal ? formatMoney(Math.abs(resteAPlanifier)) : '—'}
                icon={<TrendingUp className="h-4 w-4" />}
                iconVariant={isPlafondDepasse ? 'destructive' : 'success'}
                description={hasPlafondGlobal ? 'Plafond global − Budget planifié' : 'Aucune enveloppe WBS renseignée'}
              />
            </div>

            {/* Mini chart */}
            <HeatmapWidget ptba={ptba} />

          </div>

          {/* ── TABS ──────────────────────────────────────────────────────── */}
          <Tabs defaultValue="matrix" className="flex flex-col flex-1 min-h-0 p-4 gap-0">
            <TabsList className="shrink-0 self-start mb-3 h-auto gap-0.5 max-w-full overflow-x-auto flex-nowrap justify-start scrollbar-thin">
              <TabsTrigger value="matrix" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <LayoutGrid className="h-3.5 w-3.5" />
                Matrice Financière
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Calendar className="h-3.5 w-3.5" />
                Calendrier Mensuel
              </TabsTrigger>
              <TabsTrigger value="gantt" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ListTree className="h-3.5 w-3.5" />
                Gantt &amp; Chronologie
              </TabsTrigger>
            </TabsList>

            {/* Matrix */}
            <TabsContent value="matrix" className="flex-1 min-h-0 overflow-hidden mt-0">
              <div className="flex flex-col h-full">
                <MatrixRibbon ptba={ptba} canManage={canEditPtba} onNewActivite={handleNewActivite} wbsLabels={wbsLabels} />
                <div className="flex-1 overflow-hidden">
                  <PTBAMatrix
                    ptba={ptba}
                    canEdit={canEditPtba}
                    canDelete={canDeletePtba}
                    onEditLigne={handleEditActivite}
                    onDeleteLigne={handleDeleteActiviteRequest}
                    wbsLabels={wbsLabels}
                    responsableLabels={responsableLabels}
                    wbsNodes={wbsData?.data ?? []}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Calendar */}
            <TabsContent value="calendar" className="flex-1 min-h-0 overflow-hidden mt-0">
              <PTBACalendarView annee={annee} activities={activities} />
            </TabsContent>

            {/* Gantt */}
            <TabsContent value="gantt" className="flex-1 min-h-0 overflow-hidden mt-0">
              <PTBAGanttView annee={annee} activities={activities} />
            </TabsContent>

          </Tabs>

        </>
      )}

      {/* ── FORMULAIRE ACTIVITÉ (Modal) ─────────────────────────────────────── */}
      <PTBAActiviteForm
        open={isActiviteFormOpen}
        onOpenChange={open => {
          setIsActiviteFormOpen(open);
          if (!open) { setEditingActiviteId(null); setActiviteFormError(null); }
        }}
        projectId={resolvedProjectId}
        annee={annee}
        initialData={editingActiviteId ? editingActiviteData : null}
        onSubmit={handleActiviteFormSubmit}
        isSaving={createActiviteMutation.isPending || updateActiviteMutation.isPending}
        error={activiteFormError}
      />

      {/* ── MODAL DE CONFIRMATION DE SUPPRESSION ────────────────────────────── */}
      <Modal open={!!deleteTargetId} onOpenChange={open => { if (!open) { setDeleteTargetId(null); setDeleteError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 shrink-0">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <ModalTitle>Confirmer la suppression</ModalTitle>
                <ModalDescription className="mt-0.5">
                  Cette action est irréversible.
                </ModalDescription>
              </div>
            </div>
          </ModalHeader>
          <p className="text-sm text-muted-foreground px-6 pb-2">
            Voulez-vous supprimer cette activité PTBA ?
          </p>
          {deleteError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <Button variant="outline" onClick={() => { setDeleteTargetId(null); setDeleteError(null); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteActiviteConfirm} disabled={deleteActiviteMutation.isPending}>
              {deleteActiviteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
