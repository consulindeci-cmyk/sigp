import { useState } from 'react';
import { Clock, Plus, DollarSign, Calendar, ShoppingBag, BarChart3, Check, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_CARDS = [
  {
    icon: DollarSign,
    iconVariant: 'primary',
    title: 'Rapports Financiers',
    desc: 'Exécution budgétaire, décaissements, contributions bailleurs',
    typeValue: 'financier',
  },
  {
    icon: Calendar,
    iconVariant: 'success',
    title: 'Rapports PTBA',
    desc: 'Avancement du plan de travail annuel par composante',
    typeValue: 'ptba',
  },
  {
    icon: ShoppingBag,
    iconVariant: 'primary',
    title: 'Rapports de Passation des Marchés',
    desc: 'Statut des contrats, respect des délais',
    typeValue: 'marches',
  },
  {
    icon: BarChart3,
    iconVariant: 'warning',
    title: 'Rapports M&E',
    desc: 'Suivi du cadre logique, mise à jour des indicateurs',
    typeValue: 'me',
  },
] as const;

const ICON_VARIANT_MAP: Record<string, string> = {
  primary:     'bg-primary/10 text-primary',
  success:     'bg-success/10 text-success',
  warning:     'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

interface PlannedReport {
  id: string;
  titre: string;
  type: string;
  format: string;
  date: string;
  status: 'Planifié' | 'En cours' | 'Terminé';
}

const PLANNED_REPORTS: PlannedReport[] = [
  { id: 'pr-01', titre: 'Rapport Trimestriel T3 2026',     type: 'Avancement', format: 'PDF',   date: '30/09/2026', status: 'Planifié' },
  { id: 'pr-02', titre: 'Bilan Financier Q3 2026',         type: 'Financier',  format: 'Excel', date: '15/10/2026', status: 'Planifié' },
  { id: 'pr-03', titre: 'Rapport de Supervision Bailleur', type: 'M&E',        format: 'PDF',   date: '31/10/2026', status: 'Planifié' },
  { id: 'pr-04', titre: 'Rapport PTBA — Revue Annuelle',   type: 'PTBA',       format: 'Word',  date: '30/11/2026', status: 'Planifié' },
];

const TYPE_OPTIONS = [
  { value: 'avancement', label: "Rapport d'avancement" },
  { value: 'financier',  label: 'Rapport financier' },
  { value: 'ptba',       label: 'Rapport PTBA' },
  { value: 'marches',    label: 'Rapport Passation des Marchés' },
  { value: 'me',         label: 'Rapport M&E' },
  { value: 'evm',        label: 'Rapport EVM' },
  { value: 'risques',    label: 'Rapport des risques' },
  { value: 'final',      label: 'Rapport final' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV download helper
// ─────────────────────────────────────────────────────────────────────────────

function downloadReportCsv(type: string, format: string) {
  const typeLabel = TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
  const rows = [
    ['Rapport', typeLabel],
    ['Format demandé', format],
    ['Date de génération', new Date().toLocaleDateString('fr-FR')],
    ['Statut', 'Généré'],
    [],
    ['Indicateur', 'Valeur'],
    ['Progression globale', '68%'],
    ['Taux de décaissement', '65%'],
    ['Activités complètes', '42 / 61'],
    ['Risques critiques', '3'],
    ['Prochaine échéance', '30/09/2026'],
  ];
  const csv = '﻿' + rows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function TabReports() {
  // Generate modal
  const [showGenerate,      setShowGenerate]      = useState(false);
  const [reportType,        setReportType]        = useState('avancement');
  const [reportFormat,      setReportFormat]      = useState('csv');
  const [generating,        setGenerating]        = useState(false);
  const [generateDone,      setGenerateDone]      = useState(false);

  // Planned reports SlideOver
  const [showPlanned, setShowPlanned] = useState(false);

  function openGenerateModal(preselect?: string) {
    if (preselect) setReportType(preselect);
    setGenerateDone(false);
    setShowGenerate(true);
  }

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerateDone(true);
      downloadReportCsv(reportType, reportFormat);
      setTimeout(() => {
        setGenerateDone(false);
        setShowGenerate(false);
      }, 1400);
    }, 700);
  }

  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Centre de Rapports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Générez et planifiez les rapports du projet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="h-8 text-xs"
            leftIcon={<Clock className="h-3.5 w-3.5" />}
            onClick={() => setShowPlanned(true)}
          >
            Rapports Planifiés
          </Button>
          <Button
            variant="default" size="sm" className="h-8 text-xs"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => openGenerateModal()}
          >
            Générer un Rapport
          </Button>
        </div>
      </div>

      {/* ── GRILLE DE RAPPORTS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 text-left hover:border-primary/40 hover:bg-muted/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Générer un ${card.title}`}
              onClick={() => openGenerateModal(card.typeValue)}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${ICON_VARIANT_MAP[card.iconVariant]}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.desc}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  Générer →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── MODAL — Générer un Rapport ─────────────────────────────────────── */}
      <Modal open={showGenerate} onOpenChange={open => { if (!generating) setShowGenerate(open); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Générer un rapport</ModalTitle>
            <ModalDescription>Configurez et téléchargez votre rapport.</ModalDescription>
          </ModalHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-type">Type de rapport</label>
              <Select
                id="rpt-type"
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                disabled={generating || generateDone}
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-format">Format d'export</label>
              <Select
                id="rpt-format"
                value={reportFormat}
                onChange={e => setReportFormat(e.target.value)}
                disabled={generating || generateDone}
              >
                <option value="csv">CSV (données)</option>
                <option value="pdf">PDF (simulé)</option>
                <option value="word">Word — .docx (simulé)</option>
                <option value="excel">Excel — .xlsx (simulé)</option>
              </Select>
            </div>

            {generateDone && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20">
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                Rapport généré — téléchargement en cours…
              </div>
            )}
          </div>

          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={generating}>
                <X className="h-4 w-4 mr-1.5" />
                Annuler
              </Button>
            </ModalClose>
            <Button
              variant="default"
              onClick={handleGenerate}
              disabled={generating || generateDone}
            >
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {generating ? 'Génération…' : 'Générer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── SLIDEOVER — Rapports Planifiés ───────────────────────────────── */}
      <SlideOver open={showPlanned} onOpenChange={setShowPlanned}>
        <SlideOverContent>
          <SlideOverHeader>
            <SlideOverTitle>Rapports Planifiés</SlideOverTitle>
            <SlideOverClose asChild>
              <Button variant="ghost" size="sm" aria-label="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </SlideOverClose>
          </SlideOverHeader>

          <SlideOverBody>
            <div className="flex flex-col gap-3">
              {PLANNED_REPORTS.map(pr => (
                <div
                  key={pr.id}
                  className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/5 transition-colors"
                >
                  <div className="p-2 bg-primary/10 rounded-md shrink-0">
                    <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{pr.titre}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">{pr.type}</span>
                      <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{pr.format}</span>
                      <span className="text-[11px] text-muted-foreground">Échéance: {pr.date}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{pr.status}</Badge>
                </div>
              ))}
            </div>
          </SlideOverBody>

          <SlideOverFooter>
            <SlideOverClose asChild>
              <Button variant="outline">Fermer</Button>
            </SlideOverClose>
            <Button variant="default" onClick={() => { setShowPlanned(false); openGenerateModal(); }}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Planifier un rapport
            </Button>
          </SlideOverFooter>
        </SlideOverContent>
      </SlideOver>
    </div>
  );
}
