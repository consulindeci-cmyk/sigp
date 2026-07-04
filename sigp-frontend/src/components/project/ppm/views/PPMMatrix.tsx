import { useState, useMemo } from 'react';
import type { PPMLigne } from '@/types/ppm';
import { PPMMatrixRow } from './PPMMatrixRow';
import { Filter } from 'lucide-react';

interface PPMMatrixProps {
  lignes: PPMLigne[];
  onRowClick?: (id: string) => void;
}

const SELECT_CLASS = 'h-8 px-3 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

const TH_GROUP = 'px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground border-r border-primary/30 text-center'
const TH_GROUP_LAST = 'px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground text-center'
const TH_GROUP_STICKY = `${TH_GROUP} md:sticky md:left-0 z-30 bg-primary`

const TH_COL = 'px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r border-b border-border bg-muted/30 whitespace-nowrap'
const TH_COL_STICKY = `${TH_COL} md:sticky md:left-0 z-30 w-[200px]`
const TH_COL_RIGHT = `${TH_COL} text-right`
const TH_COL_CENTER = `${TH_COL} text-center`
const TH_COL_SECTION = `${TH_COL} border-r-2`
const TH_COL_LAST = 'px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap'

export function PPMMatrix({ lignes, onRowClick }: PPMMatrixProps) {
  const [filterBailleur,  setFilterBailleur]  = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterStatut,    setFilterStatut]    = useState('');

  const filteredLignes = useMemo(() => {
    return lignes.filter(l => {
      if (filterBailleur  && l.bailleur_id !== filterBailleur)                          return false;
      if (filterCategorie && !l.categorie.startsWith(filterCategorie))                  return false;
      if (filterStatut    && !matchStatutGroupe(l.statut, filterStatut))                return false;
      return true;
    });
  }, [lignes, filterBailleur, filterCategorie, filterStatut]);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── BARRE DE FILTRES ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2.5 bg-card border-b border-border flex-wrap">
        <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
          <Filter size={13} aria-hidden="true" /> Filtres :
        </div>

        <select
          className={SELECT_CLASS}
          value={filterBailleur}
          onChange={e => setFilterBailleur(e.target.value)}
          aria-label="Filtrer par bailleur"
        >
          <option value="">Tous les Bailleurs</option>
          <option value="b-ida">IDA (Banque Mondiale)</option>
          <option value="b-afd">AFD</option>
        </select>

        <select
          className={SELECT_CLASS}
          value={filterCategorie}
          onChange={e => setFilterCategorie(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value="">Toutes les Catégories</option>
          <option value="TRAVAUX">Travaux</option>
          <option value="BIENS">Biens</option>
          <option value="SERVICES_CONSULTANTS">Services Consultants</option>
          <option value="SERVICES_NON_CONSULTANTS">Services Non Consultants</option>
        </select>

        <select
          className={SELECT_CLASS}
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les Statuts</option>
          <option value="PLANIFICATION">Planification</option>
          <option value="PASSATION">En cours de passation</option>
          <option value="SIGNE">Contrat Signé / Exécution</option>
          <option value="CLOTURE">Clôturé</option>
          <option value="ANNULE">Annulé</option>
        </select>

        {(filterBailleur || filterCategorie || filterStatut) && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            onClick={() => { setFilterBailleur(''); setFilterCategorie(''); setFilterStatut(''); }}
          >
            Réinitialiser
          </button>
        )}

        <div className="flex-1" />

        <div className="text-xs text-muted-foreground font-medium">
          {filteredLignes.length} / {lignes.length} Ligne(s)
        </div>
      </div>

      {/* ── TABLE SCROLLABLE ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto scrollbar-thin bg-background">
        <table className="w-full text-sm text-left border-collapse table-auto" style={{ minWidth: "1800px" }}>
          <thead className="sticky top-0 z-20">

            {/* Header Groupes */}
            <tr className="bg-primary text-primary-foreground">
              <th className={TH_GROUP_STICKY}>Identifiant</th>
              <th colSpan={4} className={TH_GROUP}>Configuration du Marché</th>
              <th colSpan={2} className={TH_GROUP}>Données Financières</th>
              <th colSpan={7} className={TH_GROUP}>Chronogramme Prévisionnel (Gantt)</th>
              <th className={TH_GROUP_LAST}>Suivi</th>
            </tr>

            {/* Header Colonnes */}
            <tr>
              <th className={TH_COL_STICKY}>Référence &amp; WBS</th>
              <th className={TH_COL}>Description</th>
              <th className={TH_COL}>Catégorie</th>
              <th className={TH_COL}>Méthode</th>
              <th className={TH_COL_SECTION}>Revue</th>
              <th className={TH_COL_RIGHT}>Montant (Devise)</th>
              <th className={`${TH_COL_RIGHT} border-r-2 text-foreground`}>Montant (Base)</th>
              <th className={TH_COL_CENTER}>Prép. DAO</th>
              <th className={TH_COL_CENTER}>Lanc. DAO</th>
              <th className={TH_COL_CENTER}>Offres</th>
              <th className={TH_COL_CENTER}>Évaluation</th>
              <th className={TH_COL_CENTER}>ANO</th>
              <th className={TH_COL_CENTER}>Attribution</th>
              <th className={`${TH_COL_CENTER} border-r-2 text-foreground`}>Signature</th>
              <th className={TH_COL_LAST}>Statut Actuel</th>
            </tr>
          </thead>

          <tbody>
            {filteredLignes.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-10 py-10 text-center text-muted-foreground text-sm">
                  {lignes.length === 0
                    ? 'Aucune ligne de marché pour cette version.'
                    : 'Aucune ligne ne correspond aux filtres sélectionnés.'}
                </td>
              </tr>
            ) : (
              filteredLignes.map(ligne => (
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
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers filtre statut
// ─────────────────────────────────────────────────────────────────────────────

function matchStatutGroupe(statut: string, groupe: string): boolean {
  switch (groupe) {
    case 'PLANIFICATION':
      return statut === 'PLANIFIE' || statut === 'DAO_EN_PREPARATION';
    case 'PASSATION':
      return ['DAO_LANCE', 'OFFRES_RECUES', 'EVALUATION', 'ANO_EN_ATTENTE', 'ANO_OBTENU', 'ATTRIBUE'].includes(statut);
    case 'SIGNE':
      return statut === 'CONTRAT_SIGNE' || statut === 'EXECUTION';
    case 'CLOTURE':
      return statut === 'CLOTURE';
    case 'ANNULE':
      return statut === 'ANNULE';
    default:
      return true;
  }
}
