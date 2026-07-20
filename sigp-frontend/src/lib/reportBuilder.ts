import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { TypeRapport } from '@/types';

// ═════════════════════════════════════════════════════════════════════════
// Vrai moteur de génération de rapports — remplace la barre de progression
// setInterval et les boutons "Télécharger" vides (cf. audit Documents &
// Rapports). Construit un PDF (jspdf/jspdf-autotable) ou un classeur Excel
// (xlsx) à partir de données réellement lues en base pour le projet et la
// période choisis. Formats pris en charge : uniquement ceux pour lesquels
// une vraie librairie est présente dans le projet (PDF, Excel) — Word/CSV
// ne sont pas générés (aucune librairie docx/csv dédiée).
// ═════════════════════════════════════════════════════════════════════════

export type BuildableFormat = 'PDF' | 'Excel';

export interface BuildReportParams {
  type: TypeRapport;
  format: BuildableFormat;
  projectId: string;
  reportTitle: string;
  reportCode: string;
  dateDebut: string;
  dateFin: string;
}

export interface BuiltReportFile {
  blob: Blob;
  fileName: string;
  mimeType: string;
  sizeKo: number;
}

// ── Lecture des données réelles ──────────────────────────────────────────

interface EvmFigures {
  pv: number; ev: number; ac: number; bac: number;
  sv: number; cv: number; spi: number; cpi: number;
  eac: number; etc: number; vac: number;
}

// Même logique de sécurisation des divisions que useEvm.ts (cf. chantier EVM)
// — un projet n'a qu'un seul moteur de calcul EVM, jamais deux formules
// différentes selon l'écran.
function deriveEvm(row: { pv: number; ev: number; ac: number; bac: number }): EvmFigures {
  const pv = Number(row.pv ?? 0);
  const ev = Number(row.ev ?? 0);
  const ac = Number(row.ac ?? 0);
  const bac = Number(row.bac ?? 0);
  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv > 0 ? ev / pv : 1;
  const cpi = ac > 0 ? ev / ac : 1;
  const eac = cpi > 0 ? bac / cpi : (ac > 0 ? Infinity : bac);
  const etc = Number.isFinite(eac) ? eac - ac : Infinity;
  const vac = Number.isFinite(eac) ? bac - eac : -Infinity;
  return { pv, ev, ac, bac, sv, cv, spi, cpi, eac, etc, vac };
}

export async function fetchProjectHeader(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('nom, code, devise')
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  return data as { nom: string; code: string | null; devise: string | null } | null;
}

async function fetchEvm(projectId: string): Promise<EvmFigures> {
  const { data, error } = await supabase
    .rpc('calculate_project_evm', { p_project_id: projectId })
    .single();
  if (error) throw error;
  return deriveEvm(data as { pv: number; ev: number; ac: number; bac: number });
}

// Lignes budgétaires de la version APPROUVE uniquement — même règle que
// calculate_project_evm()/project_montant_paye_view (cf. chantiers précédents).
async function fetchBudgetLignesApprouvees(projectId: string) {
  const { data: versions, error: vErr } = await supabase
    .from('budget_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('statut', 'APPROUVE')
    .is('deleted_at', null);
  if (vErr) throw vErr;
  const versionIds = (versions ?? []).map((v: { id: string }) => v.id);
  if (versionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('budget_lignes')
    .select('code_ligne, libelle, categorie, montant_prevu, montant_engage, montant_paye')
    .in('version_id', versionIds)
    .is('deleted_at', null)
    .order('code_ligne', { ascending: true });
  if (error) throw error;
  return (data ?? []) as {
    code_ligne: string; libelle: string; categorie: string | null;
    montant_prevu: number; montant_engage: number; montant_paye: number;
  }[];
}

async function fetchPtba(projectId: string) {
  const { data, error } = await supabase
    .from('ptba_activites')
    .select('code, libelle, statut, taux_realisation, date_debut_prevue, date_fin_prevue, montant_prevu, montant_realise')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('date_debut_prevue', { ascending: true });
  if (error) throw error;
  return (data ?? []) as {
    code: string; libelle: string; statut: string; taux_realisation: number | null;
    date_debut_prevue: string | null; date_fin_prevue: string | null;
    montant_prevu: number | null; montant_realise: number | null;
  }[];
}

async function fetchTopRisques(projectId: string, limit = 10) {
  const { data, error } = await supabase
    .from('risques')
    .select('code, description, niveau_criticite, probabilite, impact, statut')
    .eq('project_id', projectId)
    .is('deleted_at', null);
  if (error) throw error;
  const order: Record<string, number> = { CRITIQUE: 4, ELEVE: 3, MODERE: 2, FAIBLE: 1 };
  return ((data ?? []) as {
    code: string | null; description: string; niveau_criticite: string;
    probabilite: string; impact: string; statut: string;
  }[])
    .sort((a, b) => (order[b.niveau_criticite] ?? 0) - (order[a.niveau_criticite] ?? 0))
    .slice(0, limit);
}

// ── Formatage ─────────────────────────────────────────────────────────────

function fmtMontant(v: number, devise: string): string {
  if (!Number.isFinite(v)) return 'Dérive critique';
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(v))} ${devise}`;
}

function fmtRatio(v: number): string {
  return Number.isFinite(v) ? v.toFixed(2) : 'N/A';
}

function fmtPct(v: number | null): string {
  return v == null ? '—' : `${Math.round(v)}%`;
}

function fmtDate(v: string | null): string {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('fr-FR'); } catch { return '—'; }
}

// ── Sections de contenu par type de rapport ──────────────────────────────
// Chaque section retourne une forme neutre (titre + tableau) exploitable
// aussi bien par le rendu PDF (autoTable) que par le classeur Excel (une
// feuille par section) — un seul jeu de requêtes, deux formats de sortie.

export interface ReportSection {
  title: string;
  head: string[];
  rows: (string | number)[][];
}

async function buildEvmSection(projectId: string, devise: string): Promise<ReportSection> {
  const evm = await fetchEvm(projectId);
  return {
    title: 'Indicateurs EVM',
    head: ['Indicateur', 'Valeur'],
    rows: [
      ['Valeur Planifiée (PV)', fmtMontant(evm.pv, devise)],
      ['Valeur Acquise (EV)', fmtMontant(evm.ev, devise)],
      ['Coût Réel (AC)', fmtMontant(evm.ac, devise)],
      ["Budget à l'achèvement (BAC)", fmtMontant(evm.bac, devise)],
      ['Écart de coût (CV)', fmtMontant(evm.cv, devise)],
      ['Écart de délai (SV)', fmtMontant(evm.sv, devise)],
      ['IPC (CPI)', fmtRatio(evm.cpi)],
      ['IPD (SPI)', fmtRatio(evm.spi)],
      ["Estimation à l'achèvement (EAC)", fmtMontant(evm.eac, devise)],
      ["Variation à l'achèvement (VAC)", fmtMontant(evm.vac, devise)],
    ],
  };
}

async function buildBudgetSection(projectId: string, devise: string): Promise<ReportSection> {
  const lignes = await fetchBudgetLignesApprouvees(projectId);
  if (lignes.length === 0) {
    return {
      title: 'Budget (version approuvée)',
      head: ['Information'],
      rows: [['Aucune version budgétaire APPROUVEE pour ce projet.']],
    };
  }
  return {
    title: 'Budget (version approuvée)',
    head: ['Code', 'Libellé', 'Catégorie', 'Prévu', 'Engagé', 'Payé'],
    rows: lignes.map(l => [
      l.code_ligne, l.libelle, l.categorie ?? '—',
      fmtMontant(Number(l.montant_prevu ?? 0), devise),
      fmtMontant(Number(l.montant_engage ?? 0), devise),
      fmtMontant(Number(l.montant_paye ?? 0), devise),
    ]),
  };
}

async function buildPtbaSection(projectId: string, devise: string): Promise<ReportSection> {
  const activites = await fetchPtba(projectId);
  if (activites.length === 0) {
    return { title: 'PTBA — Activités', head: ['Information'], rows: [['Aucune activité PTBA enregistrée.']] };
  }
  return {
    title: 'PTBA — Activités',
    head: ['Code', 'Libellé', 'Statut', 'Avancement', 'Début prévu', 'Fin prévue', 'Montant prévu', 'Montant réalisé'],
    rows: activites.map(a => [
      a.code, a.libelle, a.statut, fmtPct(a.taux_realisation),
      fmtDate(a.date_debut_prevue), fmtDate(a.date_fin_prevue),
      fmtMontant(Number(a.montant_prevu ?? 0), devise),
      fmtMontant(Number(a.montant_realise ?? 0), devise),
    ]),
  };
}

async function buildRisquesSection(projectId: string): Promise<ReportSection> {
  const risques = await fetchTopRisques(projectId);
  if (risques.length === 0) {
    return { title: 'Risques majeurs', head: ['Information'], rows: [['Aucun risque enregistré.']] };
  }
  return {
    title: 'Risques majeurs',
    head: ['Code', 'Description', 'Niveau', 'Probabilité', 'Impact', 'Statut'],
    rows: risques.map(r => [
      r.code ?? '—', r.description, r.niveau_criticite, r.probabilite, r.impact, r.statut,
    ]),
  };
}

// Sélectionne les sections réellement pertinentes selon le type de rapport —
// FINANCIER/EVM = EVM + Budget ; PTBA = activités ; RISQUES = risques
// majeurs ; les types périodiques/génériques (MENSUEL/TRIMESTRIEL/ANNUEL/
// AVANCEMENT/BAILLEUR/FINAL) combinent les trois pour une vraie synthèse.
export async function buildSections(type: TypeRapport, projectId: string, devise: string): Promise<ReportSection[]> {
  switch (type) {
    case 'FINANCIER':
    case 'EVM':
      return Promise.all([buildEvmSection(projectId, devise), buildBudgetSection(projectId, devise)]);
    case 'PTBA':
      return [await buildPtbaSection(projectId, devise)];
    case 'RISQUES':
      return [await buildRisquesSection(projectId)];
    default:
      return Promise.all([
        buildEvmSection(projectId, devise),
        buildBudgetSection(projectId, devise),
        buildRisquesSection(projectId),
        buildPtbaSection(projectId, devise),
      ]);
  }
}

// ── Assemblage du document ───────────────────────────────────────────────

function buildPdf(params: BuildReportParams, projectNom: string, sections: ReportSection[]): Blob {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(projectNom, 14, 15);
  doc.setFontSize(11);
  doc.text(params.reportTitle, 14, 22);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Période : ${params.dateDebut} → ${params.dateFin}  ·  Extrait le ${new Date().toLocaleDateString('fr-FR')}`,
    14, 28,
  );
  doc.setTextColor(0);

  let cursorY = 34;
  for (const section of sections) {
    doc.setFontSize(11);
    doc.text(section.title, 14, cursorY);
    (doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }).autoTable({
      startY: cursorY + 3,
      head: [section.head],
      body: section.rows,
      theme: 'grid',
      headStyles: { fillColor: [10, 22, 40] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error — jspdf-autotable étend le type au runtime, pas dans les types jsPDF de base.
    cursorY = doc.lastAutoTable.finalY + 10;
  }

  return doc.output('blob');
}

function buildExcel(sections: ReportSection[]): Blob {
  const wb = XLSX.utils.book_new();
  for (const section of sections) {
    const ws = XLSX.utils.aoa_to_sheet([section.head, ...section.rows]);
    // Nom de feuille limité à 31 caractères (contrainte du format XLSX).
    XLSX.utils.book_append_sheet(wb, ws, section.title.slice(0, 31));
  }
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// ── Point d'entrée ────────────────────────────────────────────────────────

export async function buildReportFile(params: BuildReportParams): Promise<BuiltReportFile> {
  const project = await fetchProjectHeader(params.projectId);
  const projectNom = project?.nom ?? 'Projet';
  const devise = project?.devise ?? 'XOF';

  const sections = await buildSections(params.type, params.projectId, devise);

  const safeName = `${params.reportCode}_${(project?.code ?? projectNom).replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}`;

  if (params.format === 'PDF') {
    const blob = buildPdf(params, projectNom, sections);
    return { blob, fileName: `${safeName}.pdf`, mimeType: 'application/pdf', sizeKo: Math.max(1, Math.round(blob.size / 1024)) };
  }

  const blob = buildExcel(sections);
  return {
    blob, fileName: `${safeName}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeKo: Math.max(1, Math.round(blob.size / 1024)),
  };
}

// Déclenche le téléchargement navigateur du fichier réellement généré.
export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
