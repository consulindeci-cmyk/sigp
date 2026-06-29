import { PageHeader } from '@/components/layout/PageHeader';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText, Calendar, ListTree, CheckCircle2, AlertCircle,
  LayoutGrid, TrendingUp, Loader2, Flame, DollarSign, Wallet,
} from 'lucide-react';
import { usePTBA, useWorkflowPTBA } from '@/hooks/usePTBA';
import { useUIStore } from '@/stores/uiStore';
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
      <Button variant="default" size="sm" disabled>
        Générer à partir du WBS
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// S-Curve mini widget
// ─────────────────────────────────────────────────────────────────────────────

const S_CURVE_POINTS = [10, 15, 25, 40, 55, 65, 80, 85, 90, 95, 98, 100];

function SCurveWidget() {
  return (
    <Card className="flex-1 min-w-[160px]" role="figure" aria-label="Courbe en S d'absorption budgétaire">
      <CardContent className="pt-3 pb-2 h-full flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          <TrendingUp className="h-3 w-3" />
          Absorption (S-Curve)
        </div>
        <div className="flex-1 flex items-end gap-[2px] min-h-[48px]">
          {S_CURVE_POINTS.map((h, i) => (
            <div key={i} className="flex-1 flex items-end relative h-full">
              <div
                className="w-full bg-primary/20 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
              <div
                className="absolute left-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                style={{ bottom: `${h}%`, transform: 'translate(-50%, 50%)' }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Heatmap mini widget
// ─────────────────────────────────────────────────────────────────────────────

const HEATMAP_DENSITY = [0.1, 0.2, 0.4, 0.8, 1, 0.7, 0.3, 0.2, 0.6, 0.9, 0.5, 0.1];

function HeatmapWidget() {
  return (
    <Card className="flex-1 min-w-[160px]" role="figure" aria-label="Heatmap densité activité mensuelle">
      <CardContent className="pt-3 pb-2 h-full flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          <Flame className="h-3 w-3" />
          Densité mensuelle
        </div>
        <div className="flex-1 grid grid-cols-12 gap-[2px] items-center min-h-[36px]">
          {HEATMAP_DENSITY.map((op, i) => (
            <div
              key={i}
              className="aspect-square bg-warning rounded-sm"
              style={{ opacity: op }}
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

function MatrixRibbon() {
  return (
    <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border flex-wrap">
      <Button variant="outline" size="sm" disabled className="text-xs h-7 px-2.5">
        Édition Multiple (Bulk)
      </Button>
      <Button variant="outline" size="sm" disabled className="text-xs h-7 px-2.5">
        Lissage Auto
      </Button>
      <Button variant="outline" size="sm" disabled className="text-xs h-7 px-2.5">
        Copier Trim.
      </Button>
      <div className="w-px h-5 bg-border mx-0.5" />
      <Button
        variant="outline"
        size="sm"
        disabled
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
  const [versionSelectionnee, setVersionSelectionnee] = useState<string>('latest');

  const { data: ptbaResponse, isLoading, error } = usePTBA(resolvedProjectId, annee);
  const workflowMutation = useWorkflowPTBA(resolvedProjectId);

  const [localPtba, setLocalPtba] = useState<PTBA | null>(null);

  useEffect(() => {
    if (ptbaResponse?.data) setLocalPtba(ptbaResponse.data);
  }, [ptbaResponse?.data]);

  const ptba = localPtba;

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

  const handleActionWorkflow = (action: 'SOUMETTRE' | 'APPROUVER' | 'REJETER') => {
    if (!ptba) return;
    let targetStatus = ptba.statut;
    if (action === 'SOUMETTRE') targetStatus = 'SOUMIS';
    if (action === 'APPROUVER') targetStatus = 'APPROUVE';
    if (action === 'REJETER') targetStatus = 'REJETE';
    workflowMutation.mutate({ ptbaId: ptba.id, nouveauStatut: targetStatus, commentaire: `Action : ${action}` });
  };

  // KPIs (réel-time via localPtba)
  const totalBudget = ptba?.budget_total || 0;
  const totalEngage = ptba?.lignes?.reduce((acc, l) => acc + (l.montant_engage || 0), 0) || 0;
  const totalDecaisse = ptba?.lignes?.reduce((acc, l) => acc + (l.montant_decaisse || 0), 0) || 0;
  const pctAbsorption = totalBudget > 0 ? Math.round((totalDecaisse / totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <PageHeader title={`PTBA {annee}`} />
            {ptba && renderStatusBadge(ptba.statut)}
          </div>

          <div className="w-px h-4 bg-border hidden sm:block" />

          <Select
            wrapperClassName="w-auto"
            className="h-8 text-xs"
            value={versionSelectionnee}
            onChange={e => setVersionSelectionnee(e.target.value)}
            aria-label="Sélectionner la version PTBA"
          >
            <option value="latest">{ptba?.nom_version || 'Version Actuelle'} (Active)</option>
            <option value="v1.0">PTBA {annee} v1.0</option>
          </Select>

          <div className="w-px h-4 bg-border hidden sm:block" />

          <p className="text-xs text-muted-foreground hidden sm:block">
            Resp: <span className="font-semibold text-foreground">
              {ptba?.cree_par || '—'}
            </span>
          </p>
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

          {ptba?.statut === 'BROUILLON' && (
            <Button
              size="sm"
              variant="default"
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleActionWorkflow('SOUMETTRE')}
              disabled={workflowMutation.isPending}
              className="h-8 text-xs"
            >
              Soumettre
            </Button>
          )}

          {ptba?.statut === 'SOUMIS' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleActionWorkflow('REJETER')}
                disabled={workflowMutation.isPending}
              >
                Rejeter
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs bg-success hover:bg-success/90 text-success-foreground"
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => handleActionWorkflow('APPROUVER')}
                disabled={workflowMutation.isPending}
              >
                Approuver
              </Button>
            </>
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

            {/* 4 KPI StatCards */}
            <div className="flex-1 min-w-[280px] grid grid-cols-2 gap-3">
              <StatCard
                title="Budget Planifié"
                value={formatMoney(totalBudget)}
                icon={<Wallet className="h-4 w-4 text-primary" />}
                iconVariant="primary"
              />
              <StatCard
                title="Engagements"
                value={formatMoney(totalEngage)}
                icon={<DollarSign className="h-4 w-4 text-warning" />}
                iconVariant="warning"
              />
              <StatCard
                title="Décaissements"
                value={formatMoney(totalDecaisse)}
                icon={<CheckCircle2 className="h-4 w-4 text-success" />}
                iconVariant="success"
              />
              <StatCard
                title="Taux Absorption"
                value={`${pctAbsorption}%`}
                icon={<TrendingUp className="h-4 w-4 text-info" />}
                iconVariant="info"
              />
            </div>

            {/* Mini charts */}
            <SCurveWidget />
            <HeatmapWidget />

          </div>

          {/* ── TABS ──────────────────────────────────────────────────────── */}
          <Tabs defaultValue="matrix" className="flex flex-col flex-1 min-h-0 p-4 gap-0">
            <TabsList className="shrink-0 self-start mb-3 h-auto gap-0.5">
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
                <MatrixRibbon />
                <div className="flex-1 overflow-hidden">
                  <PTBAMatrix ptba={ptba} onUpdatePTBA={setLocalPtba} />
                </div>
              </div>
            </TabsContent>

            {/* Calendar */}
            <TabsContent value="calendar" className="flex-1 min-h-0 overflow-hidden mt-0">
              <PTBACalendarView annee={annee} />
            </TabsContent>

            {/* Gantt */}
            <TabsContent value="gantt" className="flex-1 min-h-0 overflow-hidden mt-0">
              <PTBAGanttView annee={annee} />
            </TabsContent>

          </Tabs>

        </>
      )}

    </div>
  );
}
