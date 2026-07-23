import { useState, useMemo, useRef, Fragment } from 'react';
import * as XLSX from 'xlsx';
import type { BudgetLigne } from '@/types/budget';
import type { WBS } from '@/types';
import { BudgetMatrixRow } from './BudgetMatrixRow';
import {
  BudgetLigneSlideOver,
  type LigneSlideOverMode,
} from './BudgetLigneSlideOver';
import { useFundingSources, type FundingSource } from '@/hooks/useFundingSources';
import { useWBS } from '@/hooks/useWBS';
import { useHistory } from '@/hooks/useHistory';
import { ACTION_LABEL } from '@/mocks/historyMocks';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import {
  Plus, Download, Printer, History, Search, Trash2, X,
  Upload, Clock, CheckCircle, AlertTriangle, Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/forms/Button';
import { Badge } from '@/components/ui/data-display/Badge';
import { formatMoney } from '@/utils/format';


// ─────────────────────────────────────────────────────────────────────────────
// Import row structure
// ─────────────────────────────────────────────────────────────────────────────

interface ImportRow {
  rowIndex: number;
  libelle:      string;
  code_ligne:   string;
  bailleur_id:  string;
  bailleur_nom: string;
  unite:          string;
  quantite:       number;
  cout_unitaire:  number;
  montant_revise: number;
  isValid: boolean;
  errors:  string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number {
  const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function findBailleur(raw: string, fundingSources: FundingSource[]) {
  const r = raw.trim().toUpperCase();
  return fundingSources.find(b =>
    b.id === r
    || b.nom.toUpperCase().includes(r)
    || r.includes(b.nom.toUpperCase())
  );
}

function colVal(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const found = Object.entries(row).find(([col]) => col.toLowerCase().includes(k.toLowerCase()));
    if (found && found[1] !== '' && found[1] !== undefined) return found[1];
  }
  return '';
}

async function parseImportFile(file: File, fundingSources: FundingSource[]): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  return rows
    .filter(row => Object.values(row).some(v => String(v).trim() !== ''))
    .map((row, i) => {
      const libelle    = String(colVal(row, 'composante', 'wbs nom', 'wbs_nom', 'libellé', 'libelle')).trim();
      const codeLigne  = String(colVal(row, 'code wbs', 'wbs_id', 'wbs id', 'code')).trim()
                      || `bl-import-${i + 1}`;
      const bailleurRaw  = String(colVal(row, 'bailleur')).trim();
      const unite        = String(colVal(row, 'unité', 'unite')).trim();

      const bailleur = findBailleur(bailleurRaw, fundingSources);

      const quantite      = parseNum(colVal(row, 'quantité', 'quantite'));
      const cout_unitaire = parseNum(colVal(row, 'coût unitaire', 'cout unitaire', 'cout_unitaire'));
      const totalFromUnit = quantite > 0 && cout_unitaire > 0 ? quantite * cout_unitaire : 0;
      const montant_revise = totalFromUnit || parseNum(colVal(row, 'coût total', 'cout total', 'révisé', 'revise', 'total'));

      const errors: string[] = [];
      if (!libelle)       errors.push('Composante/WBS manquant');
      if (!bailleur)      errors.push(`Bailleur inconnu : "${bailleurRaw}"`);
      if (montant_revise <= 0) errors.push('Coût total requis (> 0)');

      return {
        rowIndex:     i + 2,
        libelle,
        code_ligne:   codeLigne,
        bailleur_id:  bailleur?.id  || '',
        bailleur_nom: bailleur?.nom || bailleurRaw,
        unite,
        quantite,
        cout_unitaire,
        montant_revise,
        isValid: errors.length === 0,
        errors,
      };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────────────────────

function exportToCsv(lignes: BudgetLigne[], filename: string) {
  const HEADERS = [
    'Code WBS', 'Libellé', 'Unité', 'Quantité', 'Coût Unitaire', 'Coût Total',
    'Financement Bailleur',
  ];
  const rows = lignes.map(l => [
    l.code_wbs || l.code_ligne, l.libelle || l.code_ligne,
    l.unite || '', l.quantite ?? '', l.cout_unitaire ?? '',
    l.montant_revise, l.montant_bailleur ?? l.montant_revise,
  ]);
  const csv = '﻿' + [HEADERS, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToXlsx(lignes: BudgetLigne[], filename: string) {
  const HEADERS = [
    'Code WBS', 'Libellé', 'Unité', 'Quantité', 'Coût Unitaire', 'Coût Total',
    'Financement Bailleur',
  ];
  const rows = lignes.map(l => [
    l.code_wbs || l.code_ligne, l.libelle || l.code_ligne,
    l.unite || '', l.quantite ?? '', l.cout_unitaire ?? '',
    l.montant_revise, l.montant_bailleur ?? l.montant_revise,
  ]);

  const totRow: (string | number)[] = [
    'TOTAL', '', '', '', '',
    lignes.reduce((s, l) => s + l.montant_revise, 0),
    '',
  ];

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows, totRow]);

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Budget Matrix');
  XLSX.writeFile(wb, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// Print helper — new window, A4 landscape, hides app chrome
// ─────────────────────────────────────────────────────────────────────────────

function printLignes(lignes: BudgetLigne[]) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n);

  const th = (label: string) => `<th>${label}</th>`;
  const td = (val: string | number, align = 'left') =>
    `<td style="text-align:${align}">${val}</td>`;

  const totRev = lignes.reduce((s, l) => s + l.montant_revise, 0);

  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Budget — Matrice Globale</title>
<style>
  @page { size: A4 landscape; margin: 1cm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #111; margin: 0; }
  h1 { font-size: 13px; margin: 0 0 2px; }
  .sub { font-size: 9px; color: #666; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e3a5f; color: #fff; padding: 4px 6px; font-size: 8px; text-align: left; border: 1px solid #ccc; }
  td { padding: 3px 6px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #f5f7fa; }
  tfoot tr { background: #1e3a5f; color: #fff; font-weight: bold; }
  .r { text-align: right; font-family: monospace; }
</style>
</head>
<body>
<h1>Budget &amp; Suivi Financier — Matrice Globale</h1>
<div class="sub">Imprimé le ${date} · ${lignes.length} ligne(s) budgétaire(s)</div>
<table>
<thead>
<tr>
  ${th('Code WBS')}${th('Libellé')}
  ${th('Unité')}${th('Qté')}${th('Coût Unit.')}${th('Coût Total')}
  ${th('Financement Bailleur')}
</tr>
</thead>
<tbody>
${lignes.map(l => `<tr>
  ${td(l.code_wbs || l.code_ligne)}${td(l.libelle || l.code_ligne)}
  ${td(l.unite || '—')}${td(l.quantite ?? '—', 'right')}
  ${td(l.cout_unitaire != null ? fmt(l.cout_unitaire) : '—', 'right')}
  ${td(fmt(l.montant_revise), 'right')}
  ${td(fmt(l.montant_bailleur ?? l.montant_revise), 'right')}
</tr>`).join('')}
</tbody>
<tfoot>
<tr>
  <td colspan="5">TOTAL (${lignes.length} ligne${lignes.length > 1 ? 's' : ''})</td>
  <td class="r">${fmt(totRev)}</td>
  <td></td>
</tr>
</tfoot>
</table>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bande de sous-total par composante WBS racine (regroupement hiérarchique,
// même principe que PTBAComponentSubtotalRow) — ligne synthétique (pas une
// vraie budget_lignes), jamais éditable, juste l'agrégation des lignes
// filles regroupées dessous.
// ─────────────────────────────────────────────────────────────────────────────

function sumBy(lignes: BudgetLigne[], key: keyof BudgetLigne): number {
  return lignes.reduce((s, l) => s + ((l[key] as number) || 0), 0);
}

// Nos codes WBS racine sont générés sans suffixe ("1", "2"...) — affichage
// aligné sur la convention Excel ("1.0", "2.0"), sans toucher à la vraie donnée.
function formatRootCode(code: string): string {
  return code.includes('.') ? code : `${code}.0`;
}

function BudgetComponentSubtotalRow({ root, lignes }: { root: WBS; lignes: BudgetLigne[] }) {
  const totalRevise = sumBy(lignes, 'montant_revise');

  // Plafond bailleur (composantes racine uniquement, cf. WBSNodeForm) —
  // porté par la colonne "Financement Bailleur" pour cette ligne de
  // sous-total (une composante n'a pas un bailleur unique comme une ligne,
  // mais une enveloppe/plafond global) ; Disponible = Plafond − Coût Total,
  // avec alerte rouge en cas de dépassement.
  const plafond = root.enveloppe_cible ?? null;
  const ecart = plafond != null ? plafond - totalRevise : null;
  const isOverBudget = ecart != null && ecart < 0;

  return (
    <tr className={`border-b-2 ${isOverBudget ? 'border-destructive bg-destructive/10' : 'border-border bg-muted/40'}`}>
      <td className={`px-4 py-2.5 font-mono text-xs font-bold text-foreground whitespace-nowrap border-r ${isOverBudget ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/40 border-border'}`}>
        {formatRootCode(root.code_wbs)}
      </td>
      <td className={`px-4 py-2.5 border-r-2 ${isOverBudget ? 'border-destructive/30' : 'border-border'}`}>
        <div className="flex items-center gap-1.5 flex-wrap font-bold text-foreground text-sm">
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{root.titre}</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({lignes.length} ligne{lignes.length > 1 ? 's' : ''})
          </span>
          {isOverBudget && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1 font-normal">
              <AlertTriangle className="h-3 w-3" />
              Dépassement de {formatMoney(Math.abs(ecart!))}
            </Badge>
          )}
        </div>
      </td>
      <td className="border-r-2 border-border" colSpan={3} />
      <td className="px-4 py-2.5 text-right font-mono text-sm font-bold text-foreground border-r-2 border-border">
        {formatMoney(totalRevise)}
      </td>
      <td className="px-4 py-2.5 text-sm font-bold text-foreground">
        {plafond != null ? formatMoney(plafond) : 'Non défini'}
      </td>
      <td className={`px-4 py-2.5 text-right font-mono text-sm font-bold border-r-2 border-border ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
        {plafond != null ? (isOverBudget ? `-${formatMoney(Math.abs(ecart!))}` : formatMoney(ecart!)) : '—'}
      </td>
      <td />
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResult {
  succeeded: number;
  failed:    { libelle: string; error: string }[];
}

interface BudgetMatrixProps {
  lignes:           BudgetLigne[];
  projectId:        string;
  canManage:        boolean;
  canDelete:        boolean;
  onAddLigne:       (data: Partial<BudgetLigne>) => Promise<void>;
  onEditLigne:      (id: string, data: Partial<BudgetLigne>) => Promise<void>;
  onDeleteLigne:    (id: string) => Promise<void>;
  onDuplicateLigne: (id: string) => Promise<void>;
  onImportLignes:   (lignes: Partial<BudgetLigne>[]) => Promise<ImportResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BudgetMatrix({
  lignes, projectId, canManage, canDelete, onAddLigne, onEditLigne, onDeleteLigne, onDuplicateLigne, onImportLignes,
}: BudgetMatrixProps) {

  const { data: fundingSources = [] } = useFundingSources(projectId);
  const { data: wbsData } = useWBS(projectId);
  const wbsNodes = wbsData?.data ?? [];

  // ── Historique (table réelle `historique`, alimentée par les Edge
  // Functions) — remplace l'ancien journal en mémoire de session, perdu au
  // rechargement. Filtré au module "Budget" (budget_versions/budget_lignes,
  // cf. useHistory.ts MODULE_MAP).
  const { data: historyData } = useHistory(projectId);
  const budgetHistoryEntries = useMemo(
    () => (historyData?.data ?? []).filter(e => e.module === 'Budget'),
    [historyData],
  );

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState('');

  // ── SlideOver (add / edit) ─────────────────────────────────────────────────
  const [slideOverOpen,  setSlideOverOpen]  = useState(false);
  const [slideOverMode,  setSlideOverMode]  = useState<LigneSlideOverMode>('new');
  const [selectedLigne,  setSelectedLigne]  = useState<BudgetLigne | null>(null);
  const [saveError,      setSaveError]      = useState<string | null>(null);
  const [isSaving,       setIsSaving]       = useState(false);

  // ── Delete modal ───────────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ligneToDelete,   setLigneToDelete]   = useState<string | null>(null);
  const [deleteError,     setDeleteError]     = useState<string | null>(null);
  const [isDeleting,      setIsDeleting]      = useState(false);

  // ── Duplicate feedback (pas de modal dédié) ───────────────────────────────
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // ── Global historique modal ───────────────────────────────────────────────
  const [historiqueOpen, setHistoriqueOpen] = useState(false);

  // ── Per-ligne historique modal ────────────────────────────────────────────
  const [ligneHistoriqueOpen,    setLigneHistoriqueOpen]    = useState(false);
  const [ligneHistoriqueId,      setLigneHistoriqueId]      = useState<string | null>(null);

  // ── Import ────────────────────────────────────────────────────────────────
  const fileInputRef           = useRef<HTMLInputElement>(null);
  const [importModalOpen,      setImportModalOpen]      = useState(false);
  const [importRows,           setImportRows]           = useState<ImportRow[]>([]);
  const [importLoading,        setImportLoading]        = useState(false);
  const [importFileName,       setImportFileName]       = useState('');
  const [importSaving,         setImportSaving]         = useState(false);
  const [importResultError,    setImportResultError]    = useState<string | null>(null);

  // ── Export feedback ────────────────────────────────────────────────────────
  const [exportDone, setExportDone] = useState<'csv' | 'excel' | null>(null);

  // ── Filtered lignes ────────────────────────────────────────────────────────
  const filteredLignes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return lignes;
    return lignes.filter(l => {
      const hay = [l.libelle, l.code_ligne, l.code_wbs, l.bailleur_nom, l.bailleur_id].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [lignes, searchQuery]);

  // ── Regroupement hiérarchique par composante WBS racine (même principe que
  // PTBAMatrix.tsx) : chaque ligne remonte à sa composante racine via
  // parent_id. Toute ligne budgétaire doit désormais être rattachée à une
  // activité WBS fille (cf. BudgetLigneSlideOver, sélection obligatoire) —
  // les anciennes lignes fantômes sans wbs_id (héritées de l'ex-étape
  // "Budget initial" du wizard de création) ont été purgées définitivement
  // en base (cf. migration 20260827100000). Une ligne dont le wbs_id ne
  // résout exceptionnellement à aucun nœud réel (ex : nœud WBS supprimé
  // après coup) est simplement écartée du regroupement, de l'affichage et
  // du TOTAL GÉNÉRAL, pour ne jamais fausser le budget réel par double compte.
  const { groups } = useMemo(() => {
    const nodesById = new Map<string, WBS>();
    for (const n of wbsNodes) nodesById.set(n.id, n);

    const findRoot = (nodeId: string): WBS | null => {
      let current = nodesById.get(nodeId);
      if (!current) return null;
      const visited = new Set<string>();
      while (current.parent_id && nodesById.has(current.parent_id) && !visited.has(current.id)) {
        visited.add(current.id);
        current = nodesById.get(current.parent_id)!;
      }
      return current;
    };

    const groupMap = new Map<string, { root: WBS; lignes: BudgetLigne[] }>();
    const order: string[] = [];

    for (const ligne of filteredLignes) {
      const root = ligne.wbs_id ? findRoot(ligne.wbs_id) : null;
      if (!root) continue;
      let g = groupMap.get(root.id);
      if (!g) { g = { root, lignes: [] }; groupMap.set(root.id, g); order.push(root.id); }
      g.lignes.push(ligne);
    }

    // Lignes enfants triées par leur propre code WBS (numeric-aware) — chaque
    // ligne affiche strictement son code (ex: 4.1, 4.2, 4.3), la bande de
    // sous-total affichant elle le code racine exact (ex: 4.0).
    const sortedGroups = order
      .map(id => groupMap.get(id)!)
      .sort((a, b) => a.root.code_wbs.localeCompare(b.root.code_wbs, undefined, { numeric: true }));
    for (const g of sortedGroups) {
      g.lignes.sort((a, b) =>
        (a.code_wbs || a.code_ligne).localeCompare(b.code_wbs || b.code_ligne, undefined, { numeric: true })
      );
    }

    return { groups: sortedGroups };
  }, [filteredLignes, wbsNodes]);

  // ── Lignes réellement rattachées au WBS (celles affichées sous une bande de
  // composante) — sert de base au TOTAL GÉNÉRAL, en excluant délibérément
  // `unassignedLignes` (lignes fantômes sans activité WBS, cf. commentaire
  // plus haut) pour ne jamais compter deux fois le même budget.
  const visibleLignes = useMemo(
    () => groups.flatMap(g => g.lignes),
    [groups],
  );

  // ── Totals ────────────────────────────────────────────────────────────────
  // plafond_global / disponible_global reprennent, à l'échelle du TOTAL
  // GÉNÉRAL, la même logique que la colonne Financement Bailleur/Disponible
  // des bandes de sous-total : somme des enveloppes des composantes affichées
  // moins le Coût Total global (cf. Plafond Global déjà établi sur WBSPage/PTBAPage).
  const totals = useMemo(() => {
    const montantRevise = visibleLignes.reduce((s, l) => s + l.montant_revise, 0);
    const plafondGlobal = groups.reduce((s, g) => s + (g.root.enveloppe_cible || 0), 0);
    return {
      montant_revise:    montantRevise,
      plafond_global:    plafondGlobal,
      disponible_global: plafondGlobal - montantRevise,
    };
  }, [visibleLignes, groups]);

  // ── Per-ligne history (selected) — filtré sur enregistrement_id, l'id réel
  // de la ligne budgétaire concernée par chaque événement historique.
  const selectedLigneHistory = useMemo(() =>
    ligneHistoriqueId
      ? budgetHistoryEntries.filter(e => e.enregistrement_id === ligneHistoriqueId)
      : [],
    [ligneHistoriqueId, budgetHistoryEntries]
  );

  const ligneHistoriqueNom = useMemo(() => {
    if (!ligneHistoriqueId) return '';
    return lignes.find(l => l.id === ligneHistoriqueId)?.libelle
      || (selectedLigneHistory[0]?.apres?.libelle as string | undefined)
      || (selectedLigneHistory[0]?.avant?.libelle as string | undefined)
      || ligneHistoriqueId;
  }, [ligneHistoriqueId, lignes, selectedLigneHistory]);

  // ── hasHistory lookup ─────────────────────────────────────────────────────
  const lignesWithHistory = useMemo(
    () => new Set(budgetHistoryEntries.map(e => e.enregistrement_id).filter((id): id is string => !!id)),
    [budgetHistoryEntries],
  );

  // ── Journal global — déjà trié du plus récent au plus ancien par useHistory
  // (ORDER BY created_at DESC) ──────────────────────────────────────────────
  const globalAuditEntries = useMemo(() =>
    budgetHistoryEntries.map(e => ({
      id:     e.id,
      date:   `${new Date(e.date).toLocaleDateString('fr-FR')} ${e.heure.slice(0, 5)}`,
      user:   e.utilisateur,
      action: `${ACTION_LABEL[e.action]} : ${e.element}`,
      statut: e.action,
    })),
  [budgetHistoryEntries]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
  }

  function openAddNew() {
    setSelectedLigne(null);
    setSlideOverMode('new');
    setSaveError(null);
    setSlideOverOpen(true);
  }

  function openEdit(ligne: BudgetLigne) {
    setSelectedLigne(ligne);
    setSlideOverMode('edit');
    setSaveError(null);
    setSlideOverOpen(true);
  }

  async function handleSave(data: Partial<BudgetLigne>) {
    setSaveError(null);
    setIsSaving(true);
    try {
      if (slideOverMode === 'new') await onAddLigne(data);
      else if (selectedLigne)      await onEditLigne(selectedLigne.id, data);
      setSlideOverOpen(false);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal(id: string) {
    setLigneToDelete(id);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!ligneToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onDeleteLigne(ligneToDelete);
      setLigneToDelete(null);
      setDeleteModalOpen(false);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicateError(null);
    try {
      await onDuplicateLigne(id);
    } catch (err) {
      setDuplicateError(extractErrorMessage(err));
    }
  }

  function openLigneHistorique(id: string) {
    setLigneHistoriqueId(id);
    setLigneHistoriqueOpen(true);
  }

  function handleExportCsv() {
    exportToCsv(filteredLignes, `budget-matrix-${new Date().toISOString().slice(0, 10)}.csv`);
    setExportDone('csv');
    setTimeout(() => setExportDone(null), 2000);
  }

  function handleExportXlsx() {
    exportToXlsx(filteredLignes, `budget-matrix-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportDone('excel');
    setTimeout(() => setExportDone(null), 2000);
  }

  // ── Import ────────────────────────────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportLoading(true);
    try {
      const rows = await parseImportFile(file, fundingSources);
      setImportRows(rows);
      setImportModalOpen(true);
    } catch {
      alert('Erreur lors de la lecture du fichier. Vérifiez le format (XLSX ou CSV).');
    } finally {
      setImportLoading(false);
      e.target.value = '';
    }
  }

  const validImportRows     = importRows.filter(r => r.isValid);
  const invalidImportRows   = importRows.filter(r => !r.isValid);

  async function confirmImport() {
    const toAdd: Partial<BudgetLigne>[] = validImportRows.map(r => ({
      libelle:         r.libelle,
      code_ligne:      r.code_ligne,
      bailleur_id:     r.bailleur_id,
      bailleur_nom:    r.bailleur_nom,
      unite:           r.unite || undefined,
      quantite:        r.quantite || undefined,
      cout_unitaire:   r.cout_unitaire || undefined,
      montant_initial: r.montant_revise,
      montant_revise:  r.montant_revise,
    }));
    setImportSaving(true);
    setImportResultError(null);
    try {
      const result = await onImportLignes(toAdd);
      if (result.failed.length > 0) {
        const preview = result.failed.slice(0, 3).map(f => `${f.libelle || '—'} (${f.error})`).join(' · ');
        setImportResultError(
          `${result.succeeded} ligne(s) importée(s), ${result.failed.length} échec(s) : ${preview}${result.failed.length > 3 ? '…' : ''}`
        );
      } else {
        setImportModalOpen(false);
        setImportRows([]);
        setImportFileName('');
      }
    } catch (err) {
      setImportResultError(extractErrorMessage(err));
    } finally {
      setImportSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center flex-wrap gap-2 px-4 py-2.5 border-b border-border bg-card">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-8 text-xs pl-8 pr-7 w-44"
          />
          {searchQuery && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery('')} aria-label="Effacer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
          {filteredLignes.length} / {lignes.length} ligne(s)
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setHistoriqueOpen(true)} title="Historique global">
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Historique</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportCsv} title="Exporter CSV">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{exportDone === 'csv' ? '✓ CSV' : 'Export CSV'}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportXlsx} title="Exporter Excel (XLSX)">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{exportDone === 'excel' ? '✓ Excel' : 'Export Excel'}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => printLignes(filteredLignes)} title="Imprimer">
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimer</span>
          </Button>

          {canManage && (
            <>
              {/* Hidden file input for import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()} disabled={importLoading}>
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{importLoading ? 'Lecture…' : 'Importer Excel'}</span>
              </Button>

              <Button variant="default" size="sm" className="h-8 text-xs gap-1.5" onClick={openAddNew}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter ligne
              </Button>
            </>
          )}
        </div>
      </div>

      {duplicateError && (
        <div className="shrink-0 mx-4 mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="flex-1">{duplicateError}</span>
          <button onClick={() => setDuplicateError(null)} aria-label="Fermer" className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Scrollable table ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto scrollbar-thin relative">
        <table className="w-full text-sm text-left border-collapse min-w-[800px] xl:min-w-[1200px]">

          <thead className="sticky top-0 z-10">
            <tr className="bg-primary text-primary-foreground">
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 bg-primary">
                Valorisation WBS
              </th>
              <th colSpan={4} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 text-center">Budget</th>
              <th colSpan={2} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide border-r-2 border-primary-foreground/20 text-center">Soldes</th>
              <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-center">Actions</th>
            </tr>
            <tr className="bg-primary/80 text-primary-foreground">
              {[
                ['Code WBS', 'bg-primary/80 border-r'],
                ['Libellé', 'border-r-2'],
                ['Unité'], ['Quantité', 'text-right'], ['Coût Unitaire', 'text-right'],
                ['Coût Total', 'text-right border-r-2'],
                ['Financement Bailleur'], ['Disponible', 'text-right border-r-2'],
                ['—', 'text-center'],
              ].map(([label, cls = '']) => (
                <th key={label} className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b border-primary border-primary-foreground/20 ${cls}`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {visibleLignes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {lignes.length === 0
                    ? 'Aucune ligne budgétaire. Cliquez sur « Ajouter ligne » ou « Importer Excel ».'
                    : 'Aucune ligne rattachée à une activité WBS ne correspond aux filtres appliqués.'}
                </td>
              </tr>
            ) : (
              groups.map(group => (
                <Fragment key={group.root.id}>
                  <BudgetComponentSubtotalRow root={group.root} lignes={group.lignes} />
                  {group.lignes.map(ligne => (
                    <BudgetMatrixRow
                      key={ligne.id}
                      ligne={ligne}
                      hasHistory={lignesWithHistory.has(ligne.id)}
                      canManage={canManage}
                      canDelete={canDelete}
                      onEdit={openEdit}
                      onDelete={openDeleteModal}
                      onDuplicate={handleDuplicate}
                      onViewHistory={openLigneHistorique}
                      indented
                    />
                  ))}
                </Fragment>
              ))
            )}
          </tbody>

          {visibleLignes.length > 0 && (
            <tfoot>
              <tr className="bg-primary/5 border-t-2 border-primary/30 font-bold">
                <td colSpan={5} className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide bg-muted/30 border-r border-border">
                  TOTAL GÉNÉRAL ({visibleLignes.length} ligne{visibleLignes.length > 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-foreground border-r-2 border-border">{formatMoney(totals.montant_revise)}</td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {totals.plafond_global > 0 ? formatMoney(totals.plafond_global) : 'Non défini'}
                </td>
                <td className={`px-4 py-3 text-right font-mono text-sm border-r-2 border-border ${totals.disponible_global < 0 ? 'text-destructive' : 'text-primary'}`}>
                  {totals.plafond_global > 0
                    ? (totals.disponible_global < 0
                        ? `-${formatMoney(Math.abs(totals.disponible_global))}`
                        : formatMoney(totals.disponible_global))
                    : '—'}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── BudgetLigneSlideOver ─────────────────────────────────────────────── */}
      <BudgetLigneSlideOver
        open={slideOverOpen}
        onOpenChange={open => { setSlideOverOpen(open); if (!open) setSaveError(null); }}
        ligne={selectedLigne}
        mode={slideOverMode}
        projectId={projectId}
        onSave={handleSave}
        isSaving={isSaving}
        error={saveError}
      />

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <Modal open={deleteModalOpen} onOpenChange={open => { setDeleteModalOpen(open); if (!open) { setLigneToDelete(null); setDeleteError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer la ligne budgétaire</ModalTitle>
            <ModalDescription>Cette action est irréversible. La ligne sera définitivement supprimée.</ModalDescription>
          </ModalHeader>
          {deleteError && (
            <p className="px-6 pb-2 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {deleteError}
            </p>
          )}
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button variant="destructive" leftIcon={<Trash2 className="h-4 w-4" />} onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Historique global ─────────────────────────────────────────────────── */}
      <Modal open={historiqueOpen} onOpenChange={setHistoriqueOpen}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Historique des modifications</ModalTitle>
            <ModalDescription>
              Journal d'audit du module Budget — {globalAuditEntries.length} événement{globalAuditEntries.length !== 1 ? 's' : ''}.
            </ModalDescription>
          </ModalHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {globalAuditEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune opération enregistrée pour ce budget.
              </p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    {['Date', 'Utilisateur', 'Action', 'Type'].map(h => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {globalAuditEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">{entry.date}</td>
                      <td className="px-3 py-2 text-xs font-medium text-foreground">{entry.user}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{entry.action}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          {entry.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Fermer</Button></ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Historique par ligne ─────────────────────────────────────────────── */}
      <Modal open={ligneHistoriqueOpen} onOpenChange={setLigneHistoriqueOpen}>
        <ModalContent className="max-w-xl">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Historique — {ligneHistoriqueNom || ligneHistoriqueId}
            </ModalTitle>
            <ModalDescription>
              {selectedLigneHistory.length} événement{selectedLigneHistory.length !== 1 ? 's' : ''} enregistré{selectedLigneHistory.length !== 1 ? 's' : ''}.
            </ModalDescription>
          </ModalHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {selectedLigneHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun historique disponible.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedLigneHistory.map(entry => {
                  const avantRevise = entry.avant?.montant_prevu as number | undefined;
                  const apresRevise = entry.apres?.montant_prevu as number | undefined;
                  return (
                    <div key={entry.id} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{ACTION_LABEL[entry.action]}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {entry.heure.slice(0, 5)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Par {entry.utilisateur}</p>
                        {avantRevise !== undefined && apresRevise !== undefined && avantRevise !== apresRevise && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Coût Total : {formatMoney(avantRevise)} → {formatMoney(apresRevise)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Fermer</Button></ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Import preview modal ─────────────────────────────────────────────── */}
      <Modal open={importModalOpen} onOpenChange={open => { if (!open) { setImportModalOpen(false); setImportRows([]); setImportResultError(null); } }}>
        <ModalContent className="max-w-3xl">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Aperçu de l'import — {importFileName}
            </ModalTitle>
            <ModalDescription>
              {importRows.length} ligne{importRows.length !== 1 ? 's' : ''} détectée{importRows.length !== 1 ? 's' : ''} ·
              <span className="text-success font-medium ml-1">{validImportRows.length} valide{validImportRows.length !== 1 ? 's' : ''}</span>
              {invalidImportRows.length > 0 && (
                <span className="text-destructive font-medium ml-1">· {invalidImportRows.length} avec erreur{invalidImportRows.length !== 1 ? 's' : ''}</span>
              )}
            </ModalDescription>
          </ModalHeader>

          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 sticky top-0">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Composante</th>
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Bailleur</th>
                  <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Coût Total</th>
                  <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importRows.map(r => (
                  <tr key={r.rowIndex} className={`${r.isValid ? '' : 'bg-destructive/5'}`}>
                    <td className="px-3 py-2 font-medium text-foreground">{r.libelle || <span className="text-destructive italic">—</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.bailleur_nom || <span className="text-destructive italic">Inconnu</span>}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatMoney(r.montant_revise)}</td>
                    <td className="px-3 py-2 text-center">
                      {r.isValid
                        ? <CheckCircle className="h-3.5 w-3.5 text-success mx-auto" />
                        : (
                          <div className="flex flex-col items-center gap-0.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            {r.errors.map((e, i) => (
                              <span key={i} className="text-[10px] text-destructive">{e}</span>
                            ))}
                          </div>
                        )
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {importResultError && (
            <p className="px-6 text-sm text-destructive flex items-center gap-1.5" role="alert">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {importResultError}
            </p>
          )}

          <ModalFooter>
            <ModalClose asChild><Button variant="outline">Annuler</Button></ModalClose>
            <Button
              variant="default"
              onClick={confirmImport}
              disabled={validImportRows.length === 0 || importSaving}
            >
              <Upload className="h-4 w-4 mr-1.5" />
              {importSaving ? 'Import en cours...' : `Importer ${validImportRows.length} ligne${validImportRows.length !== 1 ? 's' : ''}`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </div>
  );
}
