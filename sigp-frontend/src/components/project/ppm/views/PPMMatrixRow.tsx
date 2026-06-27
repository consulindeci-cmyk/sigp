import React, { memo } from 'react';
import type { PPMLigne } from '@/types/ppm';
import { formatCurrency } from '@/lib/utils';

interface PPMMatrixRowProps {
  ligne: PPMLigne;
  onClick?: () => void;
}

function getStatutColor(statut: string) {
  switch (statut) {
    case 'PLANIFIE':
    case 'DAO_EN_PREPARATION':
      return 'var(--blue-100)';
    case 'DAO_LANCE':
    case 'OFFRES_RECUES':
    case 'EVALUATION':
      return 'var(--yellow-100)';
    case 'ANO_EN_ATTENTE':
    case 'ANO_OBTENU':
    case 'ATTRIBUE':
      return 'var(--orange-100)';
    case 'CONTRAT_SIGNE':
    case 'EXECUTION':
      return 'var(--green-100)';
    case 'ANNULE':
      return 'var(--red-100)';
    case 'CLOTURE':
      return 'var(--slate-200)';
    default:
      return 'var(--slate-100)';
  }
}

function getStatutTextColor(statut: string) {
  switch (statut) {
    case 'PLANIFIE':
    case 'DAO_EN_PREPARATION':
      return 'var(--blue-700)';
    case 'DAO_LANCE':
    case 'OFFRES_RECUES':
    case 'EVALUATION':
      return 'var(--yellow-700)';
    case 'ANO_EN_ATTENTE':
    case 'ANO_OBTENU':
    case 'ATTRIBUE':
      return 'var(--orange-700)';
    case 'CONTRAT_SIGNE':
    case 'EXECUTION':
      return 'var(--green-700)';
    case 'ANNULE':
      return 'var(--red-700)';
    case 'CLOTURE':
      return 'var(--slate-700)';
    default:
      return 'var(--slate-700)';
  }
}

function PPMMatrixRowComponent({ ligne, onClick }: PPMMatrixRowProps) {
  // Rendu conditionnel des dates pour n'afficher que le mois/année ou un format court
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  };

  return (
    <tr 
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      className="matrix-row hover:bg-slate-50 transition-colors group"
    >
      {/* 1. Identifiants & Configuration */}
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', position: 'sticky', left: 0, zIndex: 10, background: 'white', minWidth: '200px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)' }}>{ligne.reference_marche}</div>
        <div style={{ fontSize: '11px', color: 'var(--slate)' }}>WBS: {ligne.wbs_id}</div>
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ fontSize: '13px', color: 'var(--navy-900)', whiteSpace: 'normal', minWidth: '200px' }}>
          {ligne.description}
        </div>
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ fontSize: '12px' }}>{ligne.categorie}</div>
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
        <div style={{ fontSize: '12px', fontWeight: 600 }}>{ligne.methode}</div>
      </td>
      <td style={{ padding: '8px 16px', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--line-soft)' }}>
        <span style={{ 
          padding: '2px 6px', 
          fontSize: '11px', 
          background: ligne.type_revue === 'PRIOR' ? 'var(--blue-50)' : 'var(--slate-50)', 
          color: ligne.type_revue === 'PRIOR' ? 'var(--blue-700)' : 'var(--slate-600)',
          borderRadius: '4px',
          fontWeight: 600
        }}>
          {ligne.type_revue}
        </span>
      </td>

      {/* 2. Données Financières */}
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--navy-800)' }}>
          {formatCurrency(ligne.montant_estime_devise, ligne.devise_code)}
        </div>
      </td>
      <td style={{ padding: '8px 16px', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--line-soft)', textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: 'var(--navy-900)' }}>
          {formatCurrency(ligne.montant_estime_base, 'XOF')}
        </div>
      </td>

      {/* 3. Dates Clés (Chronogramme) */}
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.preparation_dao_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.lancement_dao_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.remise_offres_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.ouverture_evaluation_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.avis_non_objection_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)' }}>
        {formatDate(ligne.dates_cles.attribution_prevue)}
      </td>
      <td style={{ padding: '8px 16px', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--line-soft)', textAlign: 'center', fontSize: '12px', color: 'var(--slate-700)', fontWeight: 600 }}>
        {formatDate(ligne.dates_cles.signature_contrat_prevue)}
      </td>

      {/* 4. Statut */}
      <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--line-soft)' }}>
        <span style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px', 
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 700,
          background: getStatutColor(ligne.statut),
          color: getStatutTextColor(ligne.statut),
          whiteSpace: 'nowrap'
        }}>
          {ligne.statut.replace(/_/g, ' ')}
        </span>
      </td>
    </tr>
  );
}

export const PPMMatrixRow = memo(PPMMatrixRowComponent, (prevProps, nextProps) => {
  return prevProps.ligne.version_hash === nextProps.ligne.version_hash;
});
