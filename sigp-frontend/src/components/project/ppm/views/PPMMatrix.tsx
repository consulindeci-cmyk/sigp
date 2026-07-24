import { useMemo, useState } from 'react';
import type { PPMLigne } from '@/types/ppm';
import { PPMMatrixRow } from './PPMMatrixRow';
import { useWBS } from '@/hooks/useWBS';
import { formatMoney } from '@/utils/format';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';
import { Button } from '@/components/ui/forms/Button';
import { Filter, Trash2, AlertTriangle } from 'lucide-react';

interface PPMMatrixProps {
  lignes:      PPMLigne[];
  projectId:   string;
  canManage:   boolean;
  canDelete:   boolean;
  onRowClick?: (id: string) => void;
  onDeleteLigne?: (id: string) => Promise<void>;
}

const SELECT_CLASS = 'h-8 px-3 text-xs border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

const TH = 'px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r border-b border-border bg-muted/30 whitespace-nowrap'
const TH_RIGHT = `${TH} text-right`
const TH_LAST = 'px-3 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/30 whitespace-nowrap text-right'

const COLUMN_COUNT = 8; // 7 colonnes métier + Actions

export function PPMMatrix({ lignes, projectId, canManage, canDelete, onRowClick, onDeleteLigne }: PPMMatrixProps) {
  const [filterBailleur,  setFilterBailleur]  = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterStatut,    setFilterStatut]    = useState('');

  const { data: wbsData } = useWBS(projectId);
  const wbsById = useMemo(() => {
    const map = new Map<string, { code: string; titre: string }>();
    for (const n of wbsData?.data ?? []) map.set(n.id, { code: n.code_wbs, titre: n.titre });
    return map;
  }, [wbsData]);

  const filteredLignes = useMemo(() => {
    return lignes.filter(l => {
      if (filterBailleur  && l.bailleur_id !== filterBailleur)                          return false;
      if (filterCategorie && !l.categorie.startsWith(filterCategorie))                  return false;
      if (filterStatut    && !matchStatutGroupe(l.statut, filterStatut))                return false;
      return true;
    });
  }, [lignes, filterBailleur, filterCategorie, filterStatut]);

  const totalEstime = useMemo(
    () => filteredLignes.reduce((s, l) => s + l.montant_estime_base, 0),
    [filteredLignes],
  );

  // ── Détails / Étapes (lecture seule pour l'instant — pas de vue dédiée,
  // renvoie sur la même fiche que Modifier) ──────────────────────────────────
  function handleViewDetails(id: string) {
    onRowClick?.(id);
  }

  // ── Suppression avec confirmation ──────────────────────────────────────────
  const [ligneToDelete, setLigneToDelete] = useState<string | null>(null);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);

  function openDeleteConfirm(id: string) {
    setLigneToDelete(id);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!ligneToDelete || !onDeleteLigne) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteLigne(ligneToDelete);
      setLigneToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  }

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
          <option value="BIENS">Fournitures</option>
          <option value="SERVICES_CONSULTANTS">Services de consultants</option>
          <option value="SERVICES_NON_CONSULTANTS">Services autres</option>
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
        <table className="w-full text-sm text-left border-collapse table-auto min-w-[1100px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-primary text-primary-foreground">
              <th className={`${TH} bg-primary/80 text-primary-foreground`}>Description du Marché</th>
              <th className={`${TH} bg-primary/80 text-primary-foreground`}>Type</th>
              <th className={`${TH} bg-primary/80 text-primary-foreground`}>Méthode d'acquisition</th>
              <th className={`${TH} bg-primary/80 text-primary-foreground`}>Revue bailleur</th>
              <th className={`${TH} bg-primary/80 text-primary-foreground text-center`}>Date Avis / Publication</th>
              <th className={`${TH} bg-primary/80 text-primary-foreground text-center`}>Date Signature Contrat</th>
              <th className={`${TH_RIGHT} bg-primary/80 text-primary-foreground`}>Montant Estimé</th>
              <th className={`${TH_LAST} bg-primary/80 text-primary-foreground`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLignes.length === 0 ? (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-10 py-10 text-center text-muted-foreground text-sm">
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
                  wbsLabel={wbsById.get(ligne.wbs_id)}
                  canManage={canManage}
                  canDelete={canDelete}
                  onEdit={id => onRowClick?.(id)}
                  onViewDetails={handleViewDetails}
                  onDelete={openDeleteConfirm}
                />
              ))
            )}
          </tbody>

          {filteredLignes.length > 0 && (
            <tfoot>
              <tr className="bg-primary/5 border-t-2 border-primary/30 font-bold">
                <td colSpan={6} className="px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide bg-muted/30 border-r border-border">
                  TOTAL GÉNÉRAL ({filteredLignes.length} marché{filteredLignes.length > 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                  {formatMoney(totalEstime)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Confirmation de suppression ───────────────────────────────────── */}
      <Modal open={!!ligneToDelete} onOpenChange={open => { if (!open) { setLigneToDelete(null); setDeleteError(null); } }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Supprimer la ligne de marché</ModalTitle>
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
