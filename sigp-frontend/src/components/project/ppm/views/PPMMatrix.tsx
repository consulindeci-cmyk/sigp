import React from 'react';
import type { PPMLigne } from '@/types/ppm';
import { PPMMatrixRow } from './PPMMatrixRow';
import { Filter } from 'lucide-react';

interface PPMMatrixProps {
  lignes: PPMLigne[];
  onRowClick?: (id: string) => void;
}

export function PPMMatrix({ lignes, onRowClick }: PPMMatrixProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Barre d'outils / Filtres Visuels */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '10px 16px', 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--line)',
        gap: '16px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy-600)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Filter size={14} /> Filtres :
        </div>
        <select className="input" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', width: 'auto', background: 'var(--canvas)', border: '1px solid var(--line-soft)' }}>
          <option value="">Tous les Bailleurs</option>
          <option value="IDA">IDA (Banque Mondiale)</option>
          <option value="AFD">AFD</option>
        </select>
        <select className="input" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', width: 'auto', background: 'var(--canvas)', border: '1px solid var(--line-soft)' }}>
          <option value="">Toutes les Catégories</option>
          <option value="TRAVAUX">Travaux</option>
          <option value="BIENS">Biens</option>
          <option value="SERVICES">Services</option>
        </select>
        <select className="input" style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', width: 'auto', background: 'var(--canvas)', border: '1px solid var(--line-soft)' }}>
          <option value="">Tous les Statuts</option>
          <option value="PLANIFIE">Planifié</option>
          <option value="EN_COURS">En cours de passation</option>
          <option value="SIGNE">Contrat Signé</option>
        </select>
        
        <div style={{ flex: 1 }} />
        
        <div style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 500 }}>
          {lignes.length} Ligne(s) de marché
        </div>
      </div>

      {/* Conteneur Scrollable */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} className="custom-scrollbar">
        <table className="w-full text-left border-collapse" style={{ minWidth: '1600px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            
            {/* Header Groupes */}
            <tr>
              <th colSpan={1} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '1px solid var(--navy-700)', position: 'sticky', left: 0, zIndex: 20, background: 'var(--navy-900)', color: 'white' }}>
                Identifiant
              </th>
              <th colSpan={4} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center', background: 'var(--navy-900)', color: 'white' }}>
                Configuration du Marché
              </th>
              <th colSpan={2} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center', background: 'var(--navy-900)', color: 'white' }}>
                Données Financières
              </th>
              <th colSpan={7} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '2px solid var(--navy-700)', textAlign: 'center', background: 'var(--navy-900)', color: 'white' }}>
                Chronogramme Prévisionnel (Gantt)
              </th>
              <th colSpan={1} style={{ padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', background: 'var(--navy-900)', color: 'white' }}>
                Suivi
              </th>
            </tr>
            
            {/* Header Colonnes */}
            <tr>
              {/* Identification */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', position: 'sticky', left: 0, zIndex: 20, background: 'var(--navy-800)', color: 'var(--slate-300)', width: '200px', minWidth: '200px' }}>
                Référence & WBS
              </th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Description</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Catégorie</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Méthode</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Revue</th>
              
              {/* Financier */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Montant (Devise)</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'right', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'white' }}>Montant (Base)</th>
              
              {/* Chronogramme */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Prép. DAO</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Lanc. DAO</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Offres</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Évaluation</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>ANO</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '1px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Attribution</th>
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, textAlign: 'center', borderRight: '2px solid var(--navy-700)', borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'white' }}>Signature</th>
              
              {/* Suivi */}
              <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid var(--navy-900)', background: 'var(--navy-800)', color: 'var(--slate-300)' }}>Statut Actuel</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate)' }}>
                  Aucune ligne de marché pour cette version.
                </td>
              </tr>
            ) : (
              lignes.map(ligne => (
                <PPMMatrixRow 
                  key={ligne.id} 
                  ligne={ligne} 
                  onClick={() => onRowClick && onRowClick(ligne.id)} 
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
