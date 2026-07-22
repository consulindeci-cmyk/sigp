import { useState, useEffect, useMemo, memo, Fragment, type KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown, Activity, Pencil, Trash2, Layers } from 'lucide-react';
import type { PTBA, PTBALigne, WBS } from '@/types';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';

// ============================================================================
// SOUS-COMPOSANT : Ligne de Matrice
// ============================================================================
interface PTBAMatrixRowProps {
  initialLigne: PTBALigne;
  expandedQuarters: Record<string, boolean>;
  onLigneChange: (updatedLigne: PTBALigne) => void;
  canEdit: boolean;
  canDelete: boolean;
  onEditLigne: (id: string) => void;
  onDeleteLigne: (id: string) => void;
  /** Résout wbs_id / responsable_id (des UUID bruts sans jointure côté hook)
   * en libellés lisibles — cf. audit Cadre Logique. wbsLabels ne porte que le
   * code du nœud (ex: "1.1"), pas son titre — colonne dédiée "Code WBS". */
  wbsLabels: Record<string, string>;
  responsableLabels: Record<string, string>;
  /** Indente visuellement la ligne quand elle est regroupée sous une
   * composante WBS racine (cf. PTBAComponentSubtotalRow au-dessus). */
  indented?: boolean;
}

const PTBAMatrixRow = memo(({
  initialLigne, expandedQuarters, onLigneChange, canEdit, canDelete,
  onEditLigne, onDeleteLigne, wbsLabels, responsableLabels, indented = false,
}: PTBAMatrixRowProps) => {
  const [ligne, setLigne] = useState<PTBALigne>(initialLigne);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [cellError, setCellError] = useState<string | null>(null);

  useEffect(() => {
    setLigne(initialLigne);
  }, [initialLigne]);

  const handleCellClick = (monthKey: keyof PTBALigne) => {
    // VIEWER/AUDITEUR (lecture seule) : la cellule ne bascule jamais en mode
    // édition — évite l'illusion d'un champ modifiable pour un rôle qui ne
    // peut de toute façon rien persister (cf. audit Rôles).
    if (!canEdit) return;
    setEditingCell(monthKey);
    setTempValue(String(ligne[monthKey] || 0));
    setCellError(null);
  };

  const handleBlur = (monthKey: keyof PTBALigne) => {
    commitChange(monthKey);
  };

  const handleKeyDown = (e: KeyboardEvent, monthKey: keyof PTBALigne) => {
    if (e.key === 'Enter') commitChange(monthKey);
    if (e.key === 'Escape') {
      setEditingCell(null);
      setCellError(null);
    }
  };

  const commitChange = (monthKey: keyof PTBALigne) => {
    const val = parseFloat(tempValue);
    if (isNaN(val) || val < 0) {
      setCellError('Montant invalide');
      return;
    }

    const updated = { ...ligne, [monthKey]: val };

    updated.q1_montant = updated.m1_montant + updated.m2_montant + updated.m3_montant;
    updated.q2_montant = updated.m4_montant + updated.m5_montant + updated.m6_montant;
    updated.q3_montant = updated.m7_montant + updated.m8_montant + updated.m9_montant;
    updated.q4_montant = updated.m10_montant + updated.m11_montant + updated.m12_montant;
    updated.montant_total = updated.q1_montant + updated.q2_montant + updated.q3_montant + updated.q4_montant;

    setLigne(updated);
    setEditingCell(null);
    setCellError(null);
    onLigneChange(updated);
  };

  const renderEditableMonth = (mKey: keyof PTBALigne) => {
    const isEditing = editingCell === mKey;
    return (
      <td
        key={mKey}
        className="p-0 bg-background text-right relative font-mono text-xs"
        onClick={() => !isEditing && handleCellClick(mKey)}
      >
        {isEditing ? (
          <div className="absolute inset-0 z-50 bg-card flex items-center px-2 border-2 border-primary shadow-sm">
            <input
              autoFocus
              type="number"
              value={tempValue}
              onChange={e => setTempValue(e.target.value)}
              onBlur={() => handleBlur(mKey)}
              onKeyDown={e => handleKeyDown(e, mKey)}
              className="w-full border-none outline-none text-right bg-transparent text-sm font-semibold text-foreground font-mono"
              aria-label="Montant mensuel"
            />
            {cellError && (
              <div className="absolute -top-5 right-0 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {cellError}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`px-3 py-1.5 flex items-center justify-end text-muted-foreground min-h-[32px] transition-colors ${
              canEdit ? 'cursor-text hover:bg-muted/30 hover:text-foreground' : 'cursor-default'
            }`}
          >
            {formatMoney(ligne[mKey] as number)}
          </div>
        )}
      </td>
    );
  };

  const renderQuarterGroup = (q: string, qKey: keyof PTBALigne, mKeys: (keyof PTBALigne)[]) => {
    const isExpanded = expandedQuarters[q];
    return (
      <Fragment key={q}>
        <td className={`px-3 py-1.5 font-semibold border-l border-border text-right font-mono text-xs ${isExpanded ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
          {formatMoney(ligne[qKey] as number)}
        </td>
        {isExpanded && mKeys.map(mKey => renderEditableMonth(mKey))}
      </Fragment>
    );
  };

  return (
    <tr role="row" className="border-b border-border hover:bg-muted/20 transition-colors">

      {/* Code WBS */}
      <td className="px-3 py-1.5 text-xs font-mono text-muted-foreground whitespace-nowrap bg-card border-r border-border">
        {(ligne.wbs_id && wbsLabels[ligne.wbs_id]) || '—'}
      </td>

      {/* Composante / Activité */}
      <td className="px-3 py-1.5">
        <div className={`flex items-center gap-1.5 font-semibold text-foreground text-sm ${indented ? 'pl-4' : ''}`}>
          <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{ligne.activite_nom}</span>
        </div>
        {ligne.is_procurement && (
          <div className={`mt-1 ${indented ? 'pl-9' : 'pl-5'}`}>
            <Badge variant="warning" className="text-[10px] px-1 py-0">
              Achat: {ligne.type_marche}
            </Badge>
          </div>
        )}
      </td>

      {/* Responsable */}
      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
        {ligne.responsable_externe || (ligne.responsable_id && responsableLabels[ligne.responsable_id]) || 'Non assigné'}
      </td>

      {/* Quarter groups */}
      {renderQuarterGroup('Q1', 'q1_montant', ['m1_montant', 'm2_montant', 'm3_montant'])}
      {renderQuarterGroup('Q2', 'q2_montant', ['m4_montant', 'm5_montant', 'm6_montant'])}
      {renderQuarterGroup('Q3', 'q3_montant', ['m7_montant', 'm8_montant', 'm9_montant'])}
      {renderQuarterGroup('Q4', 'q4_montant', ['m10_montant', 'm11_montant', 'm12_montant'])}

      {/* Budget Prévu (calculé — somme des trimestres) */}
      <td className="px-3 py-1.5 text-right font-bold text-foreground font-mono text-sm bg-muted/10 border-l border-border" title="Calculé automatiquement">
        {formatMoney(ligne.montant_total)}
      </td>

      {/* Actions */}
      {(canEdit || canDelete) && (
      <td className="px-2 py-1.5 border-l border-border bg-card">
        <div className="flex items-center justify-end gap-0.5">
          {canEdit && (
            <button
              onClick={() => onEditLigne(initialLigne.id)}
              title="Modifier l'activité"
              aria-label={`Modifier ${initialLigne.activite_nom}`}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil size={14} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDeleteLigne(initialLigne.id)}
              title="Supprimer l'activité"
              aria-label={`Supprimer ${initialLigne.activite_nom}`}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
      )}
    </tr>
  );
});

PTBAMatrixRow.displayName = 'PTBAMatrixRow';

// ============================================================================
// SOUS-COMPOSANT : Ligne de sous-total par composante WBS racine
// ============================================================================
// Ligne synthétique (pas une vraie ptba_activites) : jamais éditable inline,
// pas d'actions — juste l'agrégation des activités filles regroupées dessous.

function sumBy(lignes: PTBALigne[], key: keyof PTBALigne): number {
  return lignes.reduce((s, l) => s + ((l[key] as number) || 0), 0);
}

// Nos codes WBS racine sont générés sans suffixe ("1", "2"...) — affichage
// uniquement aligné sur la convention Excel de l'utilisateur ("1.0", "2.0"),
// sans toucher à la vraie donnée code_wbs.
function formatRootCode(code: string): string {
  return code.includes('.') ? code : `${code}.0`;
}

interface PTBAComponentSubtotalRowProps {
  root: WBS;
  lignes: PTBALigne[];
  expandedQuarters: Record<string, boolean>;
  showActionsColumn: boolean;
}

const PTBAComponentSubtotalRow = memo(({ root, lignes, expandedQuarters, showActionsColumn }: PTBAComponentSubtotalRowProps) => {
  const renderQuarterSubtotal = (q: string, qKey: keyof PTBALigne, mKeys: (keyof PTBALigne)[]) => {
    const isExpanded = expandedQuarters[q];
    return (
      <Fragment key={q}>
        <td className={`px-3 py-2 font-bold border-l border-border text-right font-mono text-xs ${isExpanded ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
          {formatMoney(sumBy(lignes, qKey))}
        </td>
        {isExpanded && mKeys.map(mKey => (
          <td key={mKey} className="px-3 py-2 text-right font-mono text-xs font-semibold text-foreground bg-background">
            {formatMoney(sumBy(lignes, mKey))}
          </td>
        ))}
      </Fragment>
    );
  };

  return (
    <tr role="row" className="border-b-2 border-border bg-muted/40">
      <td className="px-3 py-2 text-xs font-mono font-bold text-foreground whitespace-nowrap bg-muted/40 border-r border-border">
        {formatRootCode(root.code_wbs)}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{root.titre}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground italic whitespace-nowrap">
        {lignes.length} activité{lignes.length > 1 ? 's' : ''}
      </td>

      {renderQuarterSubtotal('Q1', 'q1_montant', ['m1_montant', 'm2_montant', 'm3_montant'])}
      {renderQuarterSubtotal('Q2', 'q2_montant', ['m4_montant', 'm5_montant', 'm6_montant'])}
      {renderQuarterSubtotal('Q3', 'q3_montant', ['m7_montant', 'm8_montant', 'm9_montant'])}
      {renderQuarterSubtotal('Q4', 'q4_montant', ['m10_montant', 'm11_montant', 'm12_montant'])}

      <td className="px-3 py-2 text-right font-bold text-foreground font-mono text-sm bg-primary/5 border-l border-border">
        {formatMoney(sumBy(lignes, 'montant_total'))}
      </td>
      {showActionsColumn && <td className="px-2 py-2 border-l border-border bg-muted/40" />}
    </tr>
  );
});

PTBAComponentSubtotalRow.displayName = 'PTBAComponentSubtotalRow';

// ============================================================================
// COMPOSANT PRINCIPAL : Matrice PTBA
// ============================================================================
interface PTBAMatrixProps {
  ptba: PTBA;
  onUpdatePTBA?: (updatedPTBA: PTBA) => void;
  /** Autorise la saisie inline des cellules mensuelles (cf. audit Rôles — VIEWER/AUDITEUR en lecture seule). */
  canEdit?: boolean;
  canDelete?: boolean;
  onEditLigne?: (id: string) => void;
  onDeleteLigne?: (id: string) => void;
  wbsLabels?: Record<string, string>;
  responsableLabels?: Record<string, string>;
  /** Arbre WBS complet du projet — sert à remonter chaque activité jusqu'à sa
   * composante racine (parent_id null) pour le regroupement hiérarchique de
   * la matrice (cf. validation fonctionnement hiérarchique Composantes/Activités). */
  wbsNodes?: WBS[];
}

export default function PTBAMatrix({
  ptba, onUpdatePTBA, canEdit = false, canDelete = false,
  onEditLigne, onDeleteLigne, wbsLabels = {}, responsableLabels = {}, wbsNodes = [],
}: PTBAMatrixProps) {
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({
    Q1: false, Q2: false, Q3: false, Q4: false,
  });

  // Regroupe chaque ligne sous sa composante WBS racine (parent_id null —
  // indépendant du champ `niveau`, auxiliaire). Une activité dont le wbs_id
  // ne résout à aucun nœud réel (jamais rattachée, ou wbs_id = code de repli,
  // cf. adaptActivite) tombe dans `unassigned`, affichée à part.
  const { groups, unassigned } = useMemo(() => {
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

    const groupMap = new Map<string, { root: WBS; lignes: PTBALigne[] }>();
    const order: string[] = [];
    const unassignedLignes: PTBALigne[] = [];

    for (const ligne of ptba.lignes ?? []) {
      const root = ligne.wbs_id ? findRoot(ligne.wbs_id) : null;
      if (!root) { unassignedLignes.push(ligne); continue; }
      let g = groupMap.get(root.id);
      if (!g) { g = { root, lignes: [] }; groupMap.set(root.id, g); order.push(root.id); }
      g.lignes.push(ligne);
    }

    const sortedGroups = order
      .map(id => groupMap.get(id)!)
      .sort((a, b) => a.root.code_wbs.localeCompare(b.root.code_wbs, undefined, { numeric: true }));

    return { groups: sortedGroups, unassigned: unassignedLignes };
  }, [ptba.lignes, wbsNodes]);

  const toggleQuarter = (q: string) => {
    setExpandedQuarters(prev => ({ ...prev, [q]: !prev[q] }));
  };

  const handleLigneChange = (updatedLigne: PTBALigne) => {
    if (!ptba.lignes) return;
    const newLignes = ptba.lignes.map(l => l.id === updatedLigne.id ? updatedLigne : l);
    const newTotal = newLignes.reduce((acc, curr) => acc + curr.montant_total, 0);
    onUpdatePTBA?.({ ...ptba, lignes: newLignes, budget_total: newTotal });
  };

  const renderQuarterHeader = (q: string, months: string[], monthRange: string) => {
    const isExpanded = expandedQuarters[q];
    return (
      <Fragment key={q}>
        <th
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          className={`min-w-[100px] cursor-pointer border-l border-border text-right px-3 py-1.5 text-[11px] uppercase font-semibold border-b-2 border-b-border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset transition-colors ${
            isExpanded ? 'bg-primary/10 text-primary' : 'bg-card text-foreground hover:bg-muted/30'
          }`}
          onClick={() => toggleQuarter(q)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleQuarter(q); } }}
          title="Cliquez pour détailler par mois"
        >
          <div className="flex flex-col items-end gap-0">
            <div className="flex items-center gap-1">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {q}
            </div>
            <span className="text-[9px] normal-case font-normal text-muted-foreground/80">{monthRange}</span>
          </div>
        </th>
        {isExpanded && months.map(m => (
          <th key={m} className="min-w-[80px] bg-background text-muted-foreground font-semibold text-right px-3 py-1.5 text-[11px] uppercase border-b-2 border-b-border border-l border-border">
            {m}
          </th>
        ))}
      </Fragment>
    );
  };

  if (!ptba.lignes || ptba.lignes.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Aucune ligne PTBA n'est disponible.
      </div>
    );
  }

  const showActionsColumn = canEdit || canDelete;

  return (
    <div className="overflow-x-auto scrollbar-thin h-full bg-background">
      <table className="border-collapse w-full text-xs" role="table">
        <thead className="sticky top-0 z-10 bg-card shadow-sm">
          <tr>
            <th className="bg-card min-w-[90px] border-r border-border px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Code WBS
            </th>
            <th className="bg-card min-w-[220px] border-r border-border px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Composante / Activité
            </th>
            <th className="min-w-[140px] px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Responsable
            </th>

            {renderQuarterHeader('Q1', ['Jan', 'Fév', 'Mar'], 'Jan–Mar')}
            {renderQuarterHeader('Q2', ['Avr', 'Mai', 'Juin'], 'Avr–Juin')}
            {renderQuarterHeader('Q3', ['Juil', 'Août', 'Sept'], 'Juil–Sep')}
            {renderQuarterHeader('Q4', ['Oct', 'Nov', 'Déc'], 'Oct–Déc')}

            <th className="min-w-[130px] text-right px-3 py-1.5 text-[11px] uppercase text-foreground font-semibold border-b-2 border-b-border border-l border-border bg-muted/10">
              Budget Prévu ($)
            </th>
            {showActionsColumn && (
              <th className="w-20 shrink-0 bg-card border-l border-border px-2 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {groups.map(group => (
            <Fragment key={group.root.id}>
              <PTBAComponentSubtotalRow
                root={group.root}
                lignes={group.lignes}
                expandedQuarters={expandedQuarters}
                showActionsColumn={showActionsColumn}
              />
              {group.lignes.map(ligne => (
                <PTBAMatrixRow
                  key={ligne.id}
                  initialLigne={ligne}
                  expandedQuarters={expandedQuarters}
                  onLigneChange={handleLigneChange}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEditLigne={onEditLigne ?? (() => {})}
                  onDeleteLigne={onDeleteLigne ?? (() => {})}
                  wbsLabels={wbsLabels}
                  responsableLabels={responsableLabels}
                  indented
                />
              ))}
            </Fragment>
          ))}

          {unassigned.length > 0 && (
            <Fragment>
              <tr role="row" className="border-b border-border bg-muted/10">
                <td colSpan={20} className="px-3 py-1.5 text-[11px] uppercase font-semibold text-muted-foreground tracking-wide">
                  Sans composante WBS ({unassigned.length})
                </td>
              </tr>
              {unassigned.map(ligne => (
                <PTBAMatrixRow
                  key={ligne.id}
                  initialLigne={ligne}
                  expandedQuarters={expandedQuarters}
                  onLigneChange={handleLigneChange}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEditLigne={onEditLigne ?? (() => {})}
                  onDeleteLigne={onDeleteLigne ?? (() => {})}
                  wbsLabels={wbsLabels}
                  responsableLabels={responsableLabels}
                />
              ))}
            </Fragment>
          )}
        </tbody>
      </table>
    </div>
  );
}
