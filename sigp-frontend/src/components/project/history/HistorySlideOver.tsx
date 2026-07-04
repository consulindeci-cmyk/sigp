import { X } from 'lucide-react';
import type { HistoriqueProjet, TypeActionHistorique, NiveauHistorique } from '@/types';
import { ACTION_LABEL } from '@/mocks/historyMocks';
import {
  SlideOver, SlideOverContent, SlideOverHeader, SlideOverTitle,
  SlideOverBody, SlideOverFooter, SlideOverClose,
} from '@/components/ui/overlays/SlideOver';
import { Button } from '@/components/ui/forms/Button';
import { Badge }  from '@/components/ui/data-display/Badge';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HistorySlideOverProps {
  open:        boolean;
  onOpenChange: (v: boolean) => void;
  evenement:   HistoriqueProjet | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function niveauVariant(n: NiveauHistorique): 'info' | 'warning' | 'destructive' {
  if (n === 'INFO')         return 'info';
  if (n === 'AVERTISSEMENT') return 'warning';
  return 'destructive';
}

function actionVariant(a: TypeActionHistorique): 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'info' | 'outline' {
  switch (a) {
    case 'CREATION':      return 'success';
    case 'MODIFICATION':  return 'default';
    case 'SUPPRESSION':   return 'destructive';
    case 'VALIDATION':    return 'success';
    case 'REJET':         return 'destructive';
    case 'CONNEXION':     return 'info';
    case 'DECONNEXION':   return 'secondary';
    case 'TELECHARGEMENT':return 'info';
    case 'IMPORT':        return 'warning';
    case 'EXPORT':        return 'warning';
    case 'ARCHIVAGE':     return 'secondary';
    case 'RESTAURATION':  return 'outline';
    default:              return 'secondary';
  }
}

function fmtDate(date: string, heure: string): string {
  try {
    const dt = new Date(`${date}T${heure}`);
    return dt.toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }) + ' à ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return `${date} ${heure}`; }
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start text-sm py-2 border-b border-border last:border-b-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground font-medium leading-relaxed">{value}</span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HistorySlideOver({ open, onOpenChange, evenement: evt }: HistorySlideOverProps) {
  if (!evt) return null;

  const initials = evt.utilisateur.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SlideOver open={open} onOpenChange={onOpenChange}>
      <SlideOverContent>
        {/* ── Header ── */}
        <SlideOverHeader>
          <div>
            <SlideOverTitle>Détail de l'événement</SlideOverTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {evt.id} · {evt.date} {evt.heure.slice(0, 5)}
            </p>
          </div>
          <SlideOverClose asChild>
            <Button variant="ghost" size="icon" aria-label="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </SlideOverClose>
        </SlideOverHeader>

        {/* ── Body ── */}
        <SlideOverBody className="space-y-5">

          {/* Résumé visuel */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant={actionVariant(evt.action)} className="text-[10px]">
                  {ACTION_LABEL[evt.action]}
                </Badge>
                <Badge variant={niveauVariant(evt.niveau)} className="text-[10px]">
                  {evt.niveau}
                </Badge>
              </div>
              <p className="text-[13px] font-semibold text-foreground leading-snug">
                {evt.description}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {fmtDate(evt.date, evt.heure)}
              </p>
            </div>
          </div>

          {/* Section: Contexte */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Contexte
            </p>
            <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
              <Row label="Module" value={
                <Badge variant="outline" className="text-[10px]">{evt.module}</Badge>
              } />
              <Row label="Élément" value={evt.element} />
              <Row label="Action" value={
                <Badge variant={actionVariant(evt.action)} className="text-[10px]">
                  {ACTION_LABEL[evt.action]}
                </Badge>
              } />
              <Row label="Niveau" value={
                <Badge variant={niveauVariant(evt.niveau)} className="text-[10px]">
                  {evt.niveau}
                </Badge>
              } />
            </div>
          </div>

          {/* Section: Auteur */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Auteur
            </p>
            <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
              <Row label="Utilisateur" value={
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                    {initials}
                  </div>
                  {evt.utilisateur}
                </div>
              } />
              <Row label="Rôle" value={evt.role} />
            </div>
          </div>

          {/* Section: Horodatage & Technique */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Horodatage & Technique
            </p>
            <div className="rounded-lg border border-border bg-card p-3 divide-y divide-border">
              <Row label="Date" value={new Date(evt.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
              <Row label="Heure" value={<span className="font-mono">{evt.heure}</span>} />
              <Row label="Adresse IP" value={<span className="font-mono text-[12px]">{evt.ip}</span>} />
              <Row label="Navigateur" value={<span className="text-[12px]">{evt.navigateur}</span>} />
              <Row label="ID événement" value={<span className="font-mono text-[11px] text-muted-foreground">{evt.id}</span>} />
            </div>
          </div>

          {/* Description complète */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-sm text-foreground leading-relaxed">{evt.description}</p>
          </div>

        </SlideOverBody>

        {/* ── Footer ── */}
        <SlideOverFooter>
          <SlideOverClose asChild>
            <Button variant="outline">Fermer</Button>
          </SlideOverClose>
        </SlideOverFooter>
      </SlideOverContent>
    </SlideOver>
  );
}
