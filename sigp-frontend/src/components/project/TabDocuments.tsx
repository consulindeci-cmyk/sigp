import { useCallback, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Files, CheckCircle2, BookOpen, Archive, HardDrive,
  Download, FileSpreadsheet, Plus, Eye, Pencil, Trash2,
  Upload, AlertCircle,
} from 'lucide-react';
import type { DocumentProjet, TypeFichier, StatutDocument, ConfidentialiteDocument } from '@/types';
import {
  MOCK_DOCUMENTS, DOCUMENT_CATEGORIES, TYPE_FICHIER_OPTIONS, STATUT_DOCUMENT_OPTIONS,
} from '@/mocks/documentsMocks';
import { DocumentSlideOver } from './documents/DocumentSlideOver';
import type { DocumentSavePayload } from './documents/DocumentSlideOver';
import { DataTable }  from '@/components/ui/data-table/DataTable';
import { StatCard }   from '@/components/ui/data-display/StatCard';
import { Badge }      from '@/components/ui/data-display/Badge';
import { Button }     from '@/components/ui/forms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/Card';
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUT_LABEL: Record<StatutDocument, string> = {
  BROUILLON:     'Brouillon',
  EN_VALIDATION: 'En validation',
  VALIDE:        'Validé',
  ARCHIVE:       'Archivé',
};

const CONF_LABEL: Record<ConfidentialiteDocument, string> = {
  PUBLIQUE:       'Publique',
  INTERNE:        'Interne',
  CONFIDENTIELLE: 'Confidentielle',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTaille(ko: number): string {
  if (ko < 1024)        return `${ko} Ko`;
  if (ko < 1024 * 1024) return `${(ko / 1024).toFixed(1)} Mo`;
  return `${(ko / (1024 * 1024)).toFixed(1)} Go`;
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return '—'; }
}

function statutVariant(s: StatutDocument): 'outline' | 'warning' | 'success' | 'secondary' {
  if (s === 'VALIDE')        return 'success';
  if (s === 'EN_VALIDATION') return 'warning';
  if (s === 'BROUILLON')     return 'outline';
  return 'secondary';
}

function typeVariant(t: TypeFichier): 'destructive' | 'default' | 'success' | 'warning' | 'secondary' | 'outline' {
  if (t === 'PDF')   return 'destructive';
  if (t === 'Word')  return 'default';
  if (t === 'Excel') return 'success';
  if (t === 'Image') return 'warning';
  if (t === 'ZIP')   return 'secondary';
  return 'outline';
}

function confVariant(c: ConfidentialiteDocument): 'success' | 'info' | 'destructive' {
  if (c === 'PUBLIQUE') return 'success';
  if (c === 'INTERNE')  return 'info';
  return 'destructive';
}

function nextDocCode(docs: DocumentProjet[]): string {
  const max = docs.reduce((m, d) => {
    const n = parseInt(d.code_document.replace('DOC-', ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `DOC-${String(max + 1).padStart(3, '0')}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TabDocuments() {
  const [documents, setDocuments] = useState<DocumentProjet[]>(MOCK_DOCUMENTS);
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideMode, setSlideMode] = useState<'new' | 'edit' | 'view'>('new');
  const [slideDoc,  setSlideDoc]  = useState<DocumentProjet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentProjet | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const valides      = documents.filter(d => d.statut === 'VALIDE').length;
    const brouillons   = documents.filter(d => d.statut === 'BROUILLON').length;
    const archives     = documents.filter(d => d.statut === 'ARCHIVE').length;
    const enValidation = documents.filter(d => d.statut === 'EN_VALIDATION').length;
    const tailleKo     = documents.reduce((s, d) => s + d.taille_ko, 0);
    return { total: documents.length, valides, brouillons, archives, enValidation, tailleKo };
  }, [documents]);

  const docsEnValidation = useMemo(
    () => documents.filter(d => d.statut === 'EN_VALIDATION'),
    [documents],
  );

  const currentNextCode = useMemo(() => nextDocCode(documents), [documents]);

  // ── Chart data ─────────────────────────────────────────────────────────────

  const categorieChartData = useMemo(() =>
    DOCUMENT_CATEGORIES
      .map(cat => ({ name: cat, Nombre: documents.filter(d => d.categorie === cat).length }))
      .filter(d => d.Nombre > 0),
  [documents]);

  const typeChartData = useMemo(() =>
    TYPE_FICHIER_OPTIONS
      .map(t => ({ name: t.label, Nombre: documents.filter(d => d.type_fichier === t.value).length }))
      .filter(d => d.Nombre > 0),
  [documents]);

  const evolutionData = useMemo(() => {
    const months: { label: string; Ajoutés: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - i);
      const mois  = dt.toISOString().slice(0, 7);
      const label = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({ label, Ajoutés: documents.filter(d => d.date_creation.startsWith(mois)).length });
    }
    return months;
  }, [documents]);

  // ── Filters ────────────────────────────────────────────────────────────────

  const auteurOptions = useMemo(() => {
    const unique = [...new Set(documents.map(d => d.auteur))].sort();
    return unique.map(a => ({ label: a, value: a }));
  }, [documents]);

  const tableFilters = useMemo(() => [
    {
      id: 'categorie',
      title: 'Catégorie',
      options: DOCUMENT_CATEGORIES.map(c => ({ label: c, value: c })),
    },
    {
      id: 'type_fichier',
      title: 'Type',
      options: TYPE_FICHIER_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'statut',
      title: 'Statut',
      options: STATUT_DOCUMENT_OPTIONS.map(o => ({ label: o.label, value: o.value })),
    },
    {
      id: 'auteur',
      title: 'Auteur',
      options: auteurOptions,
    },
  ], [auteurOptions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSave = useCallback((payload: DocumentSavePayload, id?: string) => {
    const now   = new Date().toISOString();
    const today = now.slice(0, 10);
    if (id) {
      setDocuments(prev => prev.map(d =>
        d.id === id ? { ...d, ...payload, date_modification: today, updatedAt: now } : d,
      ));
    } else {
      setDocuments(prev => {
        const newDoc: DocumentProjet = {
          id: `doc-${Date.now()}`,
          projet_id: 'mock-proj-01',
          ...payload,
          date_modification: today,
          createdAt: now,
          updatedAt: now,
        };
        return [newDoc, ...prev];
      });
    }
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const handleDuplicate = useCallback((id: string) => {
    const now   = new Date().toISOString();
    const today = now.slice(0, 10);
    setDocuments(prev => {
      const original = prev.find(d => d.id === id);
      if (!original) return prev;
      const copy: DocumentProjet = {
        ...original,
        id: `doc-${Date.now()}`,
        code_document: nextDocCode(prev),
        titre: `${original.titre} (copie)`,
        statut: 'BROUILLON',
        version: '1.0',
        date_creation:    today,
        date_modification: today,
        createdAt: now,
        updatedAt: now,
      };
      return [copy, ...prev];
    });
  }, []);

  const handleArchive = useCallback((id: string) => {
    const now   = new Date().toISOString();
    const today = now.slice(0, 10);
    setDocuments(prev => prev.map(d =>
      d.id === id ? {
        ...d,
        statut: (d.statut === 'ARCHIVE' ? 'VALIDE' : 'ARCHIVE') as StatutDocument,
        date_modification: today,
        updatedAt: now,
      } : d,
    ));
  }, []);

  const openNew  = useCallback(() => { setSlideDoc(null);  setSlideMode('new');  setSlideOpen(true); }, []);
  const openView = useCallback((d: DocumentProjet) => { setSlideDoc(d); setSlideMode('view'); setSlideOpen(true); }, []);
  const openEdit = useCallback((d: DocumentProjet) => { setSlideDoc(d); setSlideMode('edit'); setSlideOpen(true); }, []);

  // ── Upload simulé ──────────────────────────────────────────────────────────

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const typeMap: Record<string, TypeFichier> = {
      pdf: 'PDF', docx: 'Word', doc: 'Word',
      xlsx: 'Excel', xls: 'Excel',
      png: 'Image', jpg: 'Image', jpeg: 'Image', gif: 'Image', webp: 'Image',
      zip: 'ZIP', rar: 'ZIP',
    };
    const type: TypeFichier    = typeMap[ext] ?? 'Autre';
    const taille_ko            = Math.max(1, Math.round(file.size / 1024));
    const now                  = new Date().toISOString();
    const today                = now.slice(0, 10);
    setDocuments(prev => {
      const code = nextDocCode(prev);
      const newDoc: DocumentProjet = {
        id: `doc-${Date.now()}`,
        projet_id: 'mock-proj-01',
        code_document: code,
        titre: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
        categorie: 'Autre',
        version: '1.0',
        auteur: 'Utilisateur',
        responsable: 'Utilisateur',
        date_creation: today,
        date_modification: today,
        statut: 'BROUILLON',
        taille_ko,
        type_fichier: type,
        mots_cles: [],
        confidentialite: 'INTERNE',
        createdAt: now,
        updatedAt: now,
      };
      return [newDoc, ...prev];
    });
    if (uploadRef.current) uploadRef.current.value = '';
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const bom     = '﻿';
    const headers = ['Code', 'Titre', 'Catégorie', 'Type', 'Version', 'Auteur',
      'Responsable', 'Date création', 'Date modification', 'Statut',
      'Taille (Ko)', 'Confidentialité', 'Mots-clés'];
    const rows = documents.map(d => [
      d.code_document, d.titre, d.categorie, d.type_fichier, d.version,
      d.auteur, d.responsable, d.date_creation, d.date_modification,
      STATUT_LABEL[d.statut], String(d.taille_ko), CONF_LABEL[d.confidentialite],
      d.mots_cles.join('; '),
    ]);
    const csv  = bom + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'documents.csv'; a.click();
    URL.revokeObjectURL(url);
  }, [documents]);

  const exportXLSX = useCallback(() => {
    const headers = ['Code', 'Titre', 'Catégorie', 'Type', 'Version', 'Auteur',
      'Responsable', 'Date création', 'Date modification', 'Statut',
      'Taille (Ko)', 'Confidentialité', 'Mots-clés'];
    const rows = documents.map(d => [
      d.code_document, d.titre, d.categorie, d.type_fichier, d.version,
      d.auteur, d.responsable, d.date_creation, d.date_modification,
      STATUT_LABEL[d.statut], d.taille_ko, CONF_LABEL[d.confidentialite],
      d.mots_cles.join('; '),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Documents');
    XLSX.writeFile(wb, 'documents.xlsx');
  }, [documents]);

  // ── Column definitions ─────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<DocumentProjet, unknown>[]>(() => [
    {
      accessorKey: 'code_document',
      header: 'Code',
      meta: { isSticky: true } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'titre',
      header: 'Titre',
      cell: ({ row }) => {
        const { titre, activite_liee, description } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[320px]">
            <span className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2" title={titre}>
              {titre}
            </span>
            {(activite_liee || description) && (
              <span className="text-[10px] text-muted-foreground truncate">
                {activite_liee || description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'categorie',
      header: 'Catégorie',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-[10px] whitespace-nowrap">{getValue() as string}</Badge>
      ),
    },
    {
      accessorKey: 'type_fichier',
      header: 'Type',
      cell: ({ getValue }) => {
        const t = getValue() as TypeFichier;
        return <Badge variant={typeVariant(t)} className="text-[10px] font-mono whitespace-nowrap">{t}</Badge>;
      },
    },
    {
      accessorKey: 'auteur',
      header: 'Auteur',
      cell: ({ getValue }) => {
        const name    = getValue() as string;
        const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
            <span className="text-[12px] text-foreground truncate max-w-[110px]">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'date_modification',
      header: 'Modifié le',
      meta: { align: 'center' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {fmtDate(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ getValue }) => {
        const s = getValue() as StatutDocument;
        return <Badge variant={statutVariant(s)} className="text-[10px] whitespace-nowrap">{STATUT_LABEL[s]}</Badge>;
      },
    },
    {
      accessorKey: 'confidentialite',
      header: 'Accès',
      cell: ({ getValue }) => {
        const c = getValue() as ConfidentialiteDocument;
        return <Badge variant={confVariant(c)} className="text-[10px] whitespace-nowrap">{CONF_LABEL[c]}</Badge>;
      },
    },
    {
      accessorKey: 'taille_ko',
      header: 'Taille',
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {fmtTaille(getValue() as number)}
        </span>
      ),
    },
    {
      id: 'actions',
      enableHiding: false,
      meta: { align: 'right' } as Record<string, unknown>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" aria-label="Aperçu" onClick={() => openView(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Modifier" onClick={() => openEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="sm" aria-label="Supprimer"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteTarget(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ], [openView, openEdit]);

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="Gestionnaire de Documents" className="flex flex-col gap-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Gestionnaire de Documents</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralisation et gestion documentaire du projet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportXLSX}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => uploadRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Téléverser
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Nouveau document
          </Button>
          <input ref={uploadRef} type="file" className="sr-only" aria-hidden="true" tabIndex={-1} onChange={handleFileUpload} />
        </div>
      </div>

      {/* ── Alerte EN_VALIDATION ─────────────────────────────────────────── */}
      {docsEnValidation.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {docsEnValidation.length} document{docsEnValidation.length > 1 ? 's' : ''} en attente de validation
            </p>
            <p className="text-xs text-warning/80 mt-0.5">
              {docsEnValidation.map(d => d.code_document).join(', ')} — à examiner et valider
            </p>
          </div>
        </div>
      )}

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total documents"
          value={kpis.total}
          icon={<Files className="h-4 w-4" aria-hidden="true" />}
          iconVariant="primary"
          description="Dans le registre"
        />
        <StatCard
          title="Validés"
          value={kpis.valides}
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          iconVariant="success"
          description="Approuvés et publiés"
        />
        <StatCard
          title="Brouillons"
          value={kpis.brouillons}
          icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
          iconVariant="warning"
          description="En cours de rédaction"
        />
        <StatCard
          title="Archivés"
          value={kpis.archives}
          icon={<Archive className="h-4 w-4" aria-hidden="true" />}
          iconVariant="default"
          description="Versions archivées"
        />
        <StatCard
          title="Taille totale"
          value={fmtTaille(kpis.tailleKo)}
          icon={<HardDrive className="h-4 w-4" aria-hidden="true" />}
          iconVariant="info"
          description="Volume total stocké"
        />
      </div>

      {/* ── Zone de téléversement ────────────────────────────────────────── */}
      <button
        type="button"
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 text-center bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Zone de dépôt — cliquer pour parcourir les fichiers"
        onClick={() => uploadRef.current?.click()}
      >
        <Upload className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Glissez et déposez vos fichiers ici</p>
        <p className="text-xs text-muted-foreground">
          ou cliquez pour parcourir — PDF, Word, Excel, Images, ZIP — ajouté automatiquement comme Brouillon
        </p>
      </button>

      {/* ── Graphiques ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categorieChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Documents']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Nombre" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Par type de fichier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Documents']}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                />
                <Bar dataKey="Nombre" fill="hsl(var(--secondary-foreground))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 11 }}
                  formatter={(v) => [`${v}`, 'Ajoutés']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }} />
                <Line type="monotone" dataKey="Ajoutés" stroke="hsl(var(--primary))" strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Registre des documents</CardTitle>
          <Button size="sm" className="h-7 text-xs" onClick={openNew}>
            <Plus className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={documents}
            searchKey="titre"
            searchPlaceholder="Rechercher un document…"
            filters={tableFilters}
          />
        </CardContent>
      </Card>

      {/* ── SlideOver ─────────────────────────────────────────────────────── */}
      <DocumentSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        mode={slideMode}
        document={slideDoc}
        nextCode={currentNextCode}
        onSave={handleSave}
        onDelete={(id) => {
          const target = documents.find(d => d.id === id);
          if (target) { setSlideOpen(false); setDeleteTarget(target); }
        }}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
      />

      {/* ── Modal suppression ─────────────────────────────────────────────── */}
      <Modal open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer le document</ModalTitle>
            <ModalDescription>
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong>{deleteTarget?.code_document}</strong> —{' '}
              <em>{deleteTarget?.titre}</em> ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </section>
  );
}
