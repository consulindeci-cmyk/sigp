import { useState, useMemo, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Plus, ShieldAlert, ShieldCheck, AlertTriangle, Activity, Eye, Edit, Trash2, X } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type RiskCriticality = 'Critique' | 'Modéré' | 'Faible';
type RiskStatus      = 'Surveillance accrue' | 'Maîtrisé' | 'Clos';

interface Risk {
  id:           string;
  name:         string;
  category:     string;
  probability:  string;
  impact:       string;
  criticality:  RiskCriticality;
  owner:        string;
  mitigation:   string;
  status:       RiskStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — 11 risks (3 Critique, 5 Modéré, 3 Faible)
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_RISKS: Risk[] = [
  // Critique (3)
  { id: 'R-01', name: 'Retard de livraison des transformateurs',     category: "Chaîne d'approvisionnement", probability: 'Élevée',  impact: 'Majeur',   criticality: 'Critique', owner: 'Équipe Achats',           mitigation: 'Sourcer des fournisseurs alternatifs régionaux',          status: 'Surveillance accrue' },
  { id: 'R-02', name: 'Dépassement budgétaire composante A',         category: 'Financier',                  probability: 'Élevée',  impact: 'Majeur',   criticality: 'Critique', owner: 'Coordinateur Financier',   mitigation: 'Révision des devis et optimisation des coûts',           status: 'Surveillance accrue' },
  { id: 'R-03', name: "Instabilité sécuritaire dans la zone d'intervention", category: 'Sécurité',           probability: 'Modérée', impact: 'Critique', criticality: 'Critique', owner: 'Responsable Sécurité',    mitigation: 'Protocole renforcé, zones de repli définies',            status: 'Surveillance accrue' },

  // Modéré (5)
  { id: 'R-04', name: 'Turnover élevé du personnel technique',       category: 'Ressources Humaines',        probability: 'Modérée', impact: 'Modéré',   criticality: 'Modéré',   owner: 'DRH Projet',              mitigation: 'Plan de rétention et transfert de compétences',          status: 'Maîtrisé'            },
  { id: 'R-05', name: "Retards dans l'obtention des permis",         category: 'Réglementaire',              probability: 'Modérée', impact: 'Modéré',   criticality: 'Modéré',   owner: 'Coordinateur Juridique',   mitigation: 'Dépôt anticipé des dossiers administratifs',             status: 'Maîtrisé'            },
  { id: 'R-06', name: 'Fluctuation des prix des matériaux',          category: 'Financier',                  probability: 'Élevée',  impact: 'Modéré',   criticality: 'Modéré',   owner: 'Équipe Achats',           mitigation: 'Contrats à prix fixe sur 6 mois',                        status: 'Surveillance accrue' },
  { id: 'R-07', name: 'Capacité insuffisante des sous-traitants locaux', category: 'Technique',              probability: 'Modérée', impact: 'Modéré',   criticality: 'Modéré',   owner: 'Chef de Composante B',    mitigation: 'Formation et qualification préalable',                   status: 'Maîtrisé'            },
  { id: 'R-08', name: 'Résistance des communautés bénéficiaires',    category: 'Social',                     probability: 'Faible',  impact: 'Majeur',   criticality: 'Modéré',   owner: 'Responsable Communication', mitigation: 'Consultation communautaire et sensibilisation',          status: 'Maîtrisé'            },

  // Faible (3)
  { id: 'R-09', name: 'Pannes équipements informatiques',            category: 'Technique',                  probability: 'Faible',  impact: 'Faible',   criticality: 'Faible',   owner: 'Informatique',            mitigation: 'Contrat de maintenance préventive',                      status: 'Clos'                },
  { id: 'R-10', name: 'Délais de livraison du bureau logistique',    category: 'Logistique',                 probability: 'Faible',  impact: 'Faible',   criticality: 'Faible',   owner: 'Coordinateur Logistique', mitigation: 'Stock tampon de fournitures',                             status: 'Clos'                },
  { id: 'R-11', name: 'Absence de coordinateur pendant congé',       category: 'Ressources Humaines',        probability: 'Faible',  impact: 'Faible',   criticality: 'Faible',   owner: 'RH Projet',               mitigation: "Désignation d'un remplaçant",                            status: 'Maîtrisé'            },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function critBadge(crit: RiskCriticality) {
  const v = crit === 'Critique' ? 'destructive' : crit === 'Modéré' ? 'warning' : 'success';
  return <Badge variant={v} className="text-[11px] w-max">{crit}</Badge>;
}

function statusBadge(s: RiskStatus) {
  const v = s === 'Clos' ? 'secondary' : s === 'Maîtrisé' ? 'success' : 'warning';
  return <Badge variant={v} className="text-[11px] w-max">{s}</Badge>;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

// ─────────────────────────────────────────────────────────────────────────────
// Controlled form
// ─────────────────────────────────────────────────────────────────────────────

interface RiskFormValues {
  name:        string;
  category:    string;
  probability: string;
  impact:      string;
  criticality: string;
  owner:       string;
  mitigation:  string;
  status:      string;
}

type RiskFormErrors = Partial<Record<keyof RiskFormValues, string>>;

const EMPTY_RISK: RiskFormValues = {
  name: '', category: '', probability: 'Modérée', impact: 'Modéré',
  criticality: 'Modéré', owner: '', mitigation: '', status: 'Maîtrisé',
};

function riskToForm(r: Risk): RiskFormValues {
  return {
    name: r.name, category: r.category, probability: r.probability,
    impact: r.impact, criticality: r.criticality, owner: r.owner,
    mitigation: r.mitigation, status: r.status,
  };
}

function FRow({ id, label, error, full = false, children }: {
  id?: string; label: string; error?: string; full?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5${full ? ' sm:col-span-2' : ''}`}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk SlideOver
// ─────────────────────────────────────────────────────────────────────────────

type SlideOverMode = 'view' | 'edit' | 'new';

function RiskSlideOver({
  open, onOpenChange, risk, mode, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  risk: Risk | null;
  mode: SlideOverMode;
  onSave?: (data: Partial<Risk>) => void;
}) {
  const [values, setValues] = useState<RiskFormValues>(EMPTY_RISK);
  const [errors, setErrors] = useState<RiskFormErrors>({});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === 'new') setValues(EMPTY_RISK);
    else if (risk) setValues(riskToForm(risk));
  }, [open, mode, risk?.id]);

  function set(k: keyof RiskFormValues, v: string) {
    setValues(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: RiskFormErrors = {};
    if (!values.name.trim())       errs.name       = 'Requis';
    if (!values.category.trim())   errs.category   = 'Requis';
    if (!values.owner.trim())      errs.owner      = 'Requis';
    if (!values.mitigation.trim()) errs.mitigation = 'Requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave?.({
      name:        values.name.trim(),
      category:    values.category.trim(),
      probability: values.probability,
      impact:      values.impact,
      criticality: values.criticality as RiskCriticality,
      owner:       values.owner.trim(),
      mitigation:  values.mitigation.trim(),
      status:      values.status as RiskStatus,
    });
  }

  const TITLES: Record<SlideOverMode, string> = {
    view: 'Détails du risque',
    edit: 'Modifier le risque',
    new:  'Nouveau risque',
  };

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        <SlideOverHeader>
          <SlideOverTitle>{TITLES[mode]}</SlideOverTitle>
          <SlideOverClose asChild>
            <Button variant="ghost" size="sm" aria-label="Fermer"><X className="h-4 w-4" /></Button>
          </SlideOverClose>
        </SlideOverHeader>

        <SlideOverBody>
          {readOnly && risk ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Identifiant</p>
                  <p className="font-mono text-sm font-bold text-foreground">{risk.id}</p>
                </div>
                <div className="flex gap-2">{critBadge(risk.criticality)}{statusBadge(risk.status)}</div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Risque</p>
                <p className="text-sm font-semibold text-foreground">{risk.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Catégorie</p>
                  <Badge variant="outline" className="text-[11px]">{risk.category}</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Propriétaire</p>
                  <p className="text-sm text-foreground">{risk.owner}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Probabilité</p>
                  <p className="text-sm text-foreground">{risk.probability}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Impact</p>
                  <p className="text-sm text-foreground">{risk.impact}</p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Plan d'atténuation</p>
                <p className="text-sm text-foreground leading-relaxed">{risk.mitigation}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FRow id="r-name" label="Intitulé du risque" error={errors.name} full>
                <Input id="r-name" value={values.name} onChange={e => set('name', e.target.value)} placeholder="Décrire le risque…" />
              </FRow>

              <FRow id="r-cat" label="Catégorie" error={errors.category} full>
                <Input id="r-cat" value={values.category} onChange={e => set('category', e.target.value)} placeholder="Ex: Financier, Technique…" />
              </FRow>

              <FRow id="r-prob" label="Probabilité">
                <Select id="r-prob" value={values.probability} onChange={e => set('probability', e.target.value)}>
                  <option value="Faible">Faible</option>
                  <option value="Modérée">Modérée</option>
                  <option value="Élevée">Élevée</option>
                </Select>
              </FRow>

              <FRow id="r-imp" label="Impact">
                <Select id="r-imp" value={values.impact} onChange={e => set('impact', e.target.value)}>
                  <option value="Faible">Faible</option>
                  <option value="Modéré">Modéré</option>
                  <option value="Majeur">Majeur</option>
                  <option value="Critique">Critique</option>
                </Select>
              </FRow>

              <FRow id="r-crit" label="Criticité">
                <Select id="r-crit" value={values.criticality} onChange={e => set('criticality', e.target.value)}>
                  <option value="Faible">Faible</option>
                  <option value="Modéré">Modéré</option>
                  <option value="Critique">Critique</option>
                </Select>
              </FRow>

              <FRow id="r-status" label="Statut">
                <Select id="r-status" value={values.status} onChange={e => set('status', e.target.value)}>
                  <option value="Surveillance accrue">Surveillance accrue</option>
                  <option value="Maîtrisé">Maîtrisé</option>
                  <option value="Clos">Clos</option>
                </Select>
              </FRow>

              <FRow id="r-owner" label="Propriétaire" error={errors.owner} full>
                <Input id="r-owner" value={values.owner} onChange={e => set('owner', e.target.value)} placeholder="Responsable du risque" />
              </FRow>

              <FRow id="r-mit" label="Plan d'atténuation" error={errors.mitigation} full>
                <Input id="r-mit" value={values.mitigation} onChange={e => set('mitigation', e.target.value)} placeholder="Mesures de mitigation prévues…" />
              </FRow>
            </div>
          )}
        </SlideOverBody>

        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">{readOnly ? 'Fermer' : 'Annuler'}</Button>
          </SlideOverClose>
          {!readOnly && (
            <Button variant="default" onClick={handleSave}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </Button>
          )}
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Columns
// ─────────────────────────────────────────────────────────────────────────────

function buildRiskColumns(
  onView:   (r: Risk) => void,
  onEdit:   (r: Risk) => void,
  onDelete: (id: string) => void,
): ColumnDef<Risk, any>[] {
  return [
    {
      accessorKey: 'id',
      header: 'ID',
      meta: { isSticky: true } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] font-bold text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'RISQUE',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[280px]">
          <span className="font-medium text-foreground text-[13px] leading-snug">{row.original.name}</span>
          <Badge variant="outline" className="text-[10px] w-max">{row.original.category}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'probability',
      header: 'PROBABILITÉ',
      cell: ({ getValue }) => <span className="text-[13px] text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'impact',
      header: 'IMPACT',
      cell: ({ getValue }) => <span className="text-[13px] text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'criticality',
      header: 'CRITICITÉ',
      cell: ({ getValue }) => critBadge(getValue() as RiskCriticality),
    },
    {
      accessorKey: 'owner',
      header: 'PROPRIÉTAIRE',
      cell: ({ getValue }) => (
        <span className="text-[12px] text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'mitigation',
      header: "ATTÉNUATION",
      cell: ({ getValue }) => (
        <span className="text-[12px] text-foreground line-clamp-2 max-w-[240px]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUT',
      cell: ({ getValue }) => statusBadge(getValue() as RiskStatus),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as any,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Voir les détails" onClick={() => onView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => onEdit(row.original)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function TabRisks() {
  const [risks,          setRisks]          = useState<Risk[]>(INITIAL_RISKS);
  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<SlideOverMode>('new');
  const [selectedRisk,   setSelectedRisk]   = useState<Risk | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [riskToDelete,   setRiskToDelete]   = useState<string | null>(null);

  // Dynamic KPIs
  const critiques = useMemo(() => risks.filter(r => r.criticality === 'Critique').length, [risks]);
  const moderes   = useMemo(() => risks.filter(r => r.criticality === 'Modéré').length,   [risks]);
  const faibles   = useMemo(() => risks.filter(r => r.criticality === 'Faible').length,   [risks]);

  // Bar chart data from state
  const barData = useMemo(() => [
    { name: 'Critique', count: critiques, fill: 'hsl(var(--destructive))' },
    { name: 'Modéré',   count: moderes,   fill: 'hsl(var(--warning))' },
    { name: 'Faible',   count: faibles,   fill: 'hsl(var(--success))' },
  ], [critiques, moderes, faibles]);

  // Radar chart data by category
  const radarData = useMemo(() => {
    const cats: Record<string, number> = {};
    risks.forEach(r => { cats[r.category] = (cats[r.category] ?? 0) + 1; });
    return Object.entries(cats).map(([cat, count]) => ({ subject: cat, count }));
  }, [risks]);

  function openView(r: Risk) {
    setSelectedRisk(r); setSlideOverMode('view'); setSlideOverOpen(true);
  }
  function openEdit(r: Risk) {
    setSelectedRisk(r); setSlideOverMode('edit'); setSlideOverOpen(true);
  }
  function openDeleteModal(id: string) {
    setRiskToDelete(id); setDeleteModalOpen(true);
  }
  function handleDeleteConfirm() {
    if (riskToDelete) setRisks(prev => prev.filter(r => r.id !== riskToDelete));
    setDeleteModalOpen(false);
    setRiskToDelete(null);
  }

  let nextId = risks.length + 1;
  function handleSave(data: Partial<Risk>) {
    if (slideOverMode === 'new') {
      const id = `R-${String(nextId++).padStart(2, '0')}`;
      setRisks(prev => [{
        id,
        name:        data.name        ?? '',
        category:    data.category    ?? '',
        probability: data.probability ?? 'Modérée',
        impact:      data.impact      ?? 'Modéré',
        criticality: data.criticality ?? 'Modéré',
        owner:       data.owner       ?? '',
        mitigation:  data.mitigation  ?? '',
        status:      data.status      ?? 'Maîtrisé',
      }, ...prev]);
    } else if (selectedRisk) {
      setRisks(prev => prev.map(r => r.id === selectedRisk.id ? { ...r, ...data } : r));
    }
    setSlideOverOpen(false);
  }

  const columns = buildRiskColumns(openView, openEdit, openDeleteModal);

  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Registre des Risques</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de la probabilité, de l'impact et des plans d'atténuation</p>
        </div>
        <Button
          variant="default" size="sm" className="h-8 text-xs"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => { setSelectedRisk(null); setSlideOverMode('new'); setSlideOverOpen(true); }}
        >
          Nouveau Risque
        </Button>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total des Risques"
          value={risks.length}
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
          iconVariant="info"
          description="risques identifiés"
        />
        <StatCard
          title="Critiques"
          value={critiques}
          icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
          iconVariant="destructive"
          description="action immédiate"
        />
        <StatCard
          title="Modérés"
          value={moderes}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="surveillance renforcée"
        />
        <StatCard
          title="Faibles"
          value={faibles}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="sous contrôle"
        />
      </div>

      {/* ── GRAPHIQUES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Répartition par criticité</CardTitle>
            <p className="text-xs text-muted-foreground">Nombre de risques par niveau de criticité</p>
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-label="Graphique barres — répartition des risques par criticité"
              className="h-40"
            >
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} risque${Number(v) > 1 ? 's' : ''}`, undefined]} />
                  <Bar dataKey="count" name="Risques" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Répartition par catégorie</CardTitle>
            <p className="text-xs text-muted-foreground">Concentration des risques par domaine</p>
          </CardHeader>
          <CardContent>
            <div
              role="img"
              aria-label="Graphique radar — répartition des risques par catégorie"
              className="h-40"
            >
              <ResponsiveContainer width="99%" height="100%">
                <RadarChart data={radarData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
                  <PolarRadiusAxis allowDecimals={false} tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
                  <Radar dataKey="count" name="Risques" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} risque${Number(v) > 1 ? 's' : ''}`, undefined]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TABLE ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre Détaillé ({risks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={risks}
            searchKey="name"
            searchPlaceholder="Rechercher un risque…"
            filters={[
              {
                id: 'criticality',
                title: 'Criticité',
                options: [
                  { label: 'Critique', value: 'Critique' },
                  { label: 'Modéré',   value: 'Modéré'   },
                  { label: 'Faible',   value: 'Faible'   },
                ],
              },
              {
                id: 'status',
                title: 'Statut',
                options: [
                  { label: 'Surveillance accrue', value: 'Surveillance accrue' },
                  { label: 'Maîtrisé',            value: 'Maîtrisé'            },
                  { label: 'Clos',                value: 'Clos'                },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ────────────────────────────────────────────────────── */}
      <RiskSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        risk={selectedRisk}
        mode={slideOverMode}
        onSave={handleSave}
      />

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Voulez-vous supprimer ce risque ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
