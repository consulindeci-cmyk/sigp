import { useState, useEffect, memo, Fragment, type KeyboardEvent } from 'react';
import { ChevronRight, ChevronDown, Activity } from 'lucide-react';
import type { PTBA, PTBALigne } from '@/types';
import { formatMoney } from '@/utils/format';
import { Badge } from '@/components/ui/data-display/Badge';

// ============================================================================
// SOUS-COMPOSANT : Ligne de Matrice
// ============================================================================
interface PTBAMatrixRowProps {
  initialLigne: PTBALigne;
  expandedQuarters: Record<string, boolean>;
  onLigneChange: (updatedLigne: PTBALigne) => void;
}

const PTBAMatrixRow = memo(({ initialLigne, expandedQuarters, onLigneChange }: PTBAMatrixRowProps) => {
  const [ligne, setLigne] = useState<PTBALigne>(initialLigne);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [cellError, setCellError] = useState<string | null>(null);

  useEffect(() => {
    setLigne(initialLigne);
  }, [initialLigne]);

  const handleCellClick = (monthKey: keyof PTBALigne) => {
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
          <div className="cursor-text px-3 py-1.5 flex items-center justify-end text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors min-h-[32px]">
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

      {/* Sticky first column */}
      <td className="sticky left-0 z-[1] bg-card border-r border-border px-3 py-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{ligne.activite_nom}</span>
          </div>
          <div className="text-[11px] text-muted-foreground pl-5">
            WBS: {ligne.wbs_id} | Ref: {ligne.logframe_ref_id || 'N/A'}
          </div>
          {ligne.is_procurement && (
            <div className="pl-5">
              <Badge variant="warning" className="text-[10px] px-1 py-0">
                Achat: {ligne.type_marche}
              </Badge>
            </div>
          )}
        </div>
      </td>

      {/* Info columns */}
      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
        {ligne.responsable_id || 'Non assigné'}
      </td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
        {ligne.bailleur_id || '-'}
      </td>

      {/* Total (calculated) */}
      <td className="px-3 py-1.5 text-right font-bold text-foreground font-mono text-sm bg-muted/10" title="Calculé automatiquement">
        {formatMoney(ligne.montant_total)}
      </td>

      {/* Quarter groups */}
      {renderQuarterGroup('Q1', 'q1_montant', ['m1_montant', 'm2_montant', 'm3_montant'])}
      {renderQuarterGroup('Q2', 'q2_montant', ['m4_montant', 'm5_montant', 'm6_montant'])}
      {renderQuarterGroup('Q3', 'q3_montant', ['m7_montant', 'm8_montant', 'm9_montant'])}
      {renderQuarterGroup('Q4', 'q4_montant', ['m10_montant', 'm11_montant', 'm12_montant'])}
    </tr>
  );
});

PTBAMatrixRow.displayName = 'PTBAMatrixRow';

// ============================================================================
// COMPOSANT PRINCIPAL : Matrice PTBA
// ============================================================================
interface PTBAMatrixProps {
  ptba: PTBA;
  onUpdatePTBA?: (updatedPTBA: PTBA) => void;
}

export default function PTBAMatrix({ ptba, onUpdatePTBA }: PTBAMatrixProps) {
  const [expandedQuarters, setExpandedQuarters] = useState<Record<string, boolean>>({
    Q1: false, Q2: false, Q3: false, Q4: false,
  });

  const toggleQuarter = (q: string) => {
    setExpandedQuarters(prev => ({ ...prev, [q]: !prev[q] }));
  };

  const handleLigneChange = (updatedLigne: PTBALigne) => {
    if (!ptba.lignes) return;
    const newLignes = ptba.lignes.map(l => l.id === updatedLigne.id ? updatedLigne : l);
    const newTotal = newLignes.reduce((acc, curr) => acc + curr.montant_total, 0);
    onUpdatePTBA?.({ ...ptba, lignes: newLignes, budget_total: newTotal });
  };

  const renderQuarterHeader = (q: string, months: string[]) => {
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
          <div className="flex items-center justify-end gap-1">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {q}
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

  return (
    <div className="overflow-x-auto scrollbar-thin h-full bg-background">
      <table className="border-collapse w-full text-xs" role="table">
        <thead className="sticky top-0 z-10 bg-card shadow-sm">
          <tr>
            <th className="sticky left-0 z-[11] bg-card min-w-[250px] border-r border-border px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Activité &amp; Description
            </th>
            <th className="min-w-[100px] px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Responsable
            </th>
            <th className="min-w-[100px] px-3 py-1.5 text-[11px] uppercase text-muted-foreground font-semibold border-b-2 border-b-border text-left">
              Bailleur
            </th>
            <th className="min-w-[130px] text-right px-3 py-1.5 text-[11px] uppercase text-foreground font-semibold border-b-2 border-b-border bg-muted/10">
              Budget Total (Calc)
            </th>

            {renderQuarterHeader('Q1', ['Jan', 'Fév', 'Mar'])}
            {renderQuarterHeader('Q2', ['Avr', 'Mai', 'Juin'])}
            {renderQuarterHeader('Q3', ['Juil', 'Août', 'Sept'])}
            {renderQuarterHeader('Q4', ['Oct', 'Nov', 'Déc'])}
          </tr>
        </thead>
        <tbody>
          {ptba.lignes.map(ligne => (
            <PTBAMatrixRow
              key={ligne.id}
              initialLigne={ligne}
              expandedQuarters={expandedQuarters}
              onLigneChange={handleLigneChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
