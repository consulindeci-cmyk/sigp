import { memo } from 'react';
import type { PPMLigne } from '@/types/ppm';
import { formatCurrency } from '@/lib/utils';

interface PPMMatrixRowProps {
  ligne: PPMLigne;
  onClick?: () => void;
}

function getStatutClasses(statut: string): string {
  switch (statut) {
    case 'PLANIFIE':
    case 'DAO_EN_PREPARATION':
      return 'bg-primary/10 text-primary'
    case 'DAO_LANCE':
    case 'OFFRES_RECUES':
    case 'EVALUATION':
      return 'bg-warning/10 text-warning'
    case 'ANO_EN_ATTENTE':
    case 'ANO_OBTENU':
    case 'ATTRIBUE':
      return 'bg-orange-500/10 text-orange-600'
    case 'CONTRAT_SIGNE':
    case 'EXECUTION':
      return 'bg-success/10 text-success'
    case 'ANNULE':
      return 'bg-destructive/10 text-destructive'
    case 'CLOTURE':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-muted/50 text-muted-foreground'
  }
}

const CELL = 'px-4 py-2 border-r border-b border-border text-sm'
const CELL_SECTION = 'px-4 py-2 border-r-2 border-b border-border border-r-border text-sm'
const CELL_LAST = 'px-4 py-2 border-b border-border text-sm'
const DATE_CELL = `${CELL} text-center text-xs text-muted-foreground`

function PPMMatrixRowComponent({ ligne, onClick }: PPMMatrixRowProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  }

  return (
    <tr
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      className="hover:bg-muted/5 transition-colors group"
    >
      {/* 1. Identifiants */}
      <td className={`${CELL} bg-card group-hover:bg-muted/5 sticky left-0 z-10 transition-colors`}>
        <div className="font-semibold text-foreground">{ligne.reference_marche}</div>
        <div className="text-[11px] text-muted-foreground">WBS: {ligne.wbs_id}</div>
      </td>
      <td className={CELL}>
        <div className="text-foreground whitespace-normal min-w-[200px]">{ligne.description}</div>
      </td>
      <td className={CELL}>
        <div className="text-muted-foreground">{ligne.categorie}</div>
      </td>
      <td className={CELL}>
        <div className="font-semibold text-foreground">{ligne.methode}</div>
      </td>
      <td className={CELL_SECTION}>
        <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
          ligne.type_revue === 'PRIOR'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}>
          {ligne.type_revue}
        </span>
      </td>

      {/* 2. Données Financières */}
      <td className={`${CELL} text-right`}>
        <div className="font-mono text-foreground">
          {formatCurrency(ligne.montant_estime_devise, ligne.devise_code)}
        </div>
      </td>
      <td className={`${CELL_SECTION} text-right`}>
        <div className="font-mono font-semibold text-foreground">
          {formatCurrency(ligne.montant_estime_base, 'XOF')}
        </div>
      </td>

      {/* 3. Dates Clés */}
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.preparation_dao_prevue)}</td>
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.lancement_dao_prevue)}</td>
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.remise_offres_prevue)}</td>
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.ouverture_evaluation_prevue)}</td>
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.avis_non_objection_prevue)}</td>
      <td className={DATE_CELL}>{formatDate(ligne.dates_cles.attribution_prevue)}</td>
      <td className={`${CELL_SECTION} text-center text-xs font-semibold text-muted-foreground`}>
        {formatDate(ligne.dates_cles.signature_contrat_prevue)}
      </td>

      {/* 4. Statut */}
      <td className={CELL_LAST}>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${getStatutClasses(ligne.statut)}`}>
          {ligne.statut.replace(/_/g, ' ')}
        </span>
      </td>
    </tr>
  )
}

export const PPMMatrixRow = memo(PPMMatrixRowComponent, (prevProps, nextProps) => {
  return prevProps.ligne.version_hash === nextProps.ligne.version_hash
})
