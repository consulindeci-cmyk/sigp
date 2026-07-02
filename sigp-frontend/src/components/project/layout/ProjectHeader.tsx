import { useState } from 'react';
import { Edit2, Share2, FileText, AlertTriangle, Copy, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { Input } from '@/components/ui/forms/Input';
import { Select } from '@/components/ui/forms/Select';
import { Card, CardContent } from '@/components/ui/data-display/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { ProjectSlideOver } from '@/components/projects/ProjectSlideOver';
import type { Project } from '@/mocks/projectsMocks';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function statusBadgeVariant(
  status: Project['status'],
): 'warning' | 'destructive' | 'success' | 'secondary' {
  switch (status) {
    case 'En retard':      return 'destructive';
    case 'À risque':       return 'warning';
    case 'En bonne voie':  return 'success';
    case 'Clôturé':        return 'secondary';
    default:               return 'secondary';
  }
}

// ── Gauge bar ─────────────────────────────────────────────────────────────────

function GaugeBar({
  label, value, barClass, valueClass,
}: {
  label: string; value: number; barClass: string; valueClass: string;
}) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold ${valueClass}`}>{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(value, 100)}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ProjectHeaderProps {
  project: Project;
  onProjectUpdate: (p: Project) => void;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ProjectHeader({ project, onProjectUpdate }: ProjectHeaderProps) {
  const [showEdit,    setShowEdit]    = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [showRapport, setShowRapport] = useState(false);
  const [linkCopied,  setLinkCopied]  = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // DEFAULT TO EXPANDED

  const [rapportType,       setRapportType]       = useState('avancement');
  const [rapportFormat,     setRapportFormat]     = useState('csv');
  const [rapportGenerating, setRapportGenerating] = useState(false);
  const [rapportDone,       setRapportDone]       = useState(false);

  function handleSaveProject(data: Partial<Project>) {
    onProjectUpdate({ ...project, ...data });
    setShowEdit(false);
  }

  function handleCopyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleGenerateReport() {
    setRapportGenerating(true);
    setTimeout(() => {
      setRapportGenerating(false);
      setRapportDone(true);

      const rows = [
        ['Indicateur', 'Valeur'],
        ['Projet', project.name],
        ['Code', project.code],
        ['Bailleur', project.donor],
        ['Pays', project.country],
        ['Secteur', project.sector],
        ['Chef de projet', project.manager],
        ['Statut', project.status],
        ['Budget total', project.budgetDisplay],
        ['Date début', project.startDate],
        ['Date fin', project.endDate],
        ['Progression physique', `${project.progressScore}%`],
        ['Taux de décaissement', `${project.tauxDecaissement}%`],
        ['Profil qualité', `${project.profileScore}%`],
      ];
      const csv = '﻿' + rows
        .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${rapportType}-${project.code}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setRapportDone(false);
        setShowRapport(false);
      }, 1400);
    }, 700);
  }

  const physBarClass = project.progressScore >= 70
    ? 'bg-success' : project.progressScore >= 40 ? 'bg-warning' : 'bg-destructive';
  const physValClass = project.progressScore >= 70
    ? 'text-success' : project.progressScore >= 40 ? 'text-warning' : 'text-destructive';

  const hasAlert = project.status === 'En retard' || project.status === 'À risque';

  return (
    <>
      <Card className="mb-6 border-t-4 border-t-primary rounded-lg shadow-sm bg-card border-border">
        <CardContent className={`p-6 transition-all duration-300 ${isCollapsed ? 'pb-4' : ''}`}>

          <PageHeader
            title={project.name}
            badges={
              <>
                <span className="font-mono text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                  {project.code}
                </span>
                <Badge variant={statusBadgeVariant(project.status)}>{project.status}</Badge>
                <Badge variant="outline">{project.sector}</Badge>
              </>
            }
            actions={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Afficher les détails du projet" : "Masquer les détails du projet"}
                  className="px-2"
                >
                  {isCollapsed ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronUp className="w-5 h-5 text-muted-foreground" />}
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Edit2 className="w-4 h-4" />}
                  onClick={() => setShowEdit(true)}
                  className="hidden md:flex"
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  leftIcon={<Share2 className="w-4 h-4" />}
                  onClick={() => setShowShare(true)}
                  className="hidden md:flex"
                >
                  Partager
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => { setRapportDone(false); setShowRapport(true); }}
                  className="hidden md:flex"
                >
                  Rapport
                </Button>
              </>
            }
          />

          {/* Wrapper collapsible */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0 mt-0' : 'max-h-[1000px] opacity-100 mt-6'}`}>


          {/* Meta info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 pb-6 border-b border-border">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bailleur Principal</span>
              <span className="text-sm font-semibold text-foreground">{project.donor}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chef de Projet</span>
              <span className="text-sm font-semibold text-foreground">{project.manager}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Total</span>
              <span className="text-sm font-bold text-primary">{project.budgetDisplay}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Calendrier</span>
              <span className="text-sm font-semibold text-foreground">
                {formatDateShort(project.startDate)} – {formatDateShort(project.endDate)}
              </span>
            </div>
          </div>

          {/* Progress bars + alert */}
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <GaugeBar
                label="Profil / Complétude"
                value={project.profileScore}
                barClass="bg-warning"
                valueClass="text-warning"
              />
              <GaugeBar
                label="Progression Physique"
                value={project.progressScore}
                barClass={physBarClass}
                valueClass={physValClass}
              />
              <GaugeBar
                label="Taux de Décaissement"
                value={project.tauxDecaissement}
                barClass={project.tauxDecaissement >= 60 ? 'bg-success' : 'bg-warning'}
                valueClass={project.tauxDecaissement >= 60 ? 'text-success' : 'text-warning'}
              />
            </div>

            {hasAlert && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md flex items-start gap-3 min-w-0 lg:min-w-[280px] w-full lg:w-auto">
                <div className="shrink-0 p-1 bg-destructive/10 text-destructive rounded-full mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-destructive">Alerte Projet</div>
                  <div className="text-xs text-destructive/80 mt-0.5">
                    {project.status === 'En retard'
                      ? 'Projet en retard — progression insuffisante par rapport au calendrier.'
                      : 'Projet à risque — surveiller les indicateurs EVM et les risques.'}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* ── SlideOver modification ─────────────────────────────────────── */}
      <ProjectSlideOver
        open={showEdit}
        onOpenChange={setShowEdit}
        project={project}
        mode="edit"
        onSave={handleSaveProject}
      />

      {/* ── Modal Partager ─────────────────────────────────────────────── */}
      <Modal open={showShare} onOpenChange={setShowShare}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Partager ce projet</ModalTitle>
            <ModalDescription>
              Partagez le lien vers <strong className="text-foreground">{project.name}</strong> avec votre équipe.
            </ModalDescription>
          </ModalHeader>
          <div className="py-2 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 font-mono text-xs"
                aria-label="Lien du projet"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                {linkCopied
                  ? <><Check className="h-4 w-4 text-success" /><span className="ml-1.5 text-success">Copié !</span></>
                  : <><Copy className="h-4 w-4" /><span className="ml-1.5">Copier</span></>
                }
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Les utilisateurs ayant accès à l'application pourront consulter ce projet via ce lien.
            </p>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">
                <X className="h-4 w-4 mr-1.5" />
                Fermer
              </Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal Rapport ──────────────────────────────────────────────── */}
      <Modal open={showRapport} onOpenChange={open => { if (!rapportGenerating) setShowRapport(open); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Générer un rapport</ModalTitle>
            <ModalDescription>
              Rapport pour le projet <strong className="text-foreground">{project.name}</strong>.
            </ModalDescription>
          </ModalHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-type">
                Type de rapport
              </label>
              <Select
                id="rpt-type"
                value={rapportType}
                onChange={e => setRapportType(e.target.value)}
                disabled={rapportGenerating || rapportDone}
              >
                <option value="avancement">Rapport d'avancement</option>
                <option value="financier">Rapport financier</option>
                <option value="evm">Rapport EVM</option>
                <option value="risques">Rapport des risques</option>
                <option value="final">Rapport final</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="rpt-format">
                Format d'export
              </label>
              <Select
                id="rpt-format"
                value={rapportFormat}
                onChange={e => setRapportFormat(e.target.value)}
                disabled={rapportGenerating || rapportDone}
              >
                <option value="csv">CSV (données)</option>
                <option value="pdf">PDF (simulé)</option>
                <option value="word">Word — .docx (simulé)</option>
              </Select>
            </div>
            {rapportDone && (
              <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-md px-3 py-2 border border-success/20">
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                Rapport généré — téléchargement en cours…
              </div>
            )}
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline" disabled={rapportGenerating}>Annuler</Button>
            </ModalClose>
            <Button
              variant="default"
              onClick={handleGenerateReport}
              disabled={rapportGenerating || rapportDone}
            >
              <FileText className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {rapportGenerating ? 'Génération…' : 'Générer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
