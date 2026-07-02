import { useState, useRef, useMemo } from 'react';
import { Upload, Download, FileText, Trash2, Search, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Badge } from '@/components/ui/data-display/Badge';
import {
  Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription,
  ModalFooter, ModalClose,
} from '@/components/ui/overlays/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DocCategory =
  | 'Contrats'
  | 'Rapports'
  | 'TDR'
  | "Dossiers d'AO"
  | 'Comptes-rendus'
  | 'Photos'
  | 'Études'
  | "Docs d'Audit";

interface Doc {
  id:           string;
  nom:          string;
  meta:         string;
  tag:          DocCategory;
  size:         string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — representative sample across all 8 categories
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_DOCS: Doc[] = [
  // Contrats (3)
  { id: 'd1',  nom: 'Contrat_C-014-A_Signé.pdf',              meta: 'Hassan Diallo · 14/05/2026 · 2.4 Mo',            tag: 'Contrats',       size: '2.4 Mo'  },
  { id: 'd2',  nom: 'Avenant_01_Contrat_C-012.pdf',           meta: 'Moussa Coulibaly · 22/04/2026 · 1.1 Mo',         tag: 'Contrats',       size: '1.1 Mo'  },
  { id: 'd3',  nom: 'Contrat_C-015_Infrastructure.pdf',       meta: 'Aminata Koné · 10/06/2026 · 3.2 Mo',             tag: 'Contrats',       size: '3.2 Mo'  },

  // Rapports (3)
  { id: 'd4',  nom: 'Rapport_Avancement_T2_2026.pdf',         meta: 'Équipe Projet · 30/06/2026 · 4.8 Mo',            tag: 'Rapports',       size: '4.8 Mo'  },
  { id: 'd5',  nom: 'Rapport_Financier_Mai_2026.xlsx',        meta: 'Coordinateur Financier · 05/06/2026 · 890 Ko',   tag: 'Rapports',       size: '890 Ko'  },
  { id: 'd6',  nom: 'Rapport_Mensuel_Avancement_Juin.docx',   meta: 'Chef de Projet · 28/06/2026 · 2.1 Mo',           tag: 'Rapports',       size: '2.1 Mo'  },

  // TDR (2)
  { id: 'd7',  nom: 'TDR_Expert_Technique_Eau.pdf',           meta: 'Équipe Passation · 12/03/2026 · 650 Ko',         tag: 'TDR',            size: '650 Ko'  },
  { id: 'd8',  nom: 'TDR_Consultant_Formation.docx',          meta: 'DRH Projet · 04/04/2026 · 430 Ko',               tag: 'TDR',            size: '430 Ko'  },

  // Dossiers d'AO (2)
  { id: 'd9',  nom: 'DAO_Travaux_Piste_Rurale.pdf',           meta: 'Équipe Passation · 15/02/2026 · 12.3 Mo',        tag: "Dossiers d'AO", size: '12.3 Mo' },
  { id: 'd10', nom: 'DAO_Fourniture_Equipements.pdf',         meta: 'Équipe Passation · 01/03/2026 · 8.7 Mo',         tag: "Dossiers d'AO", size: '8.7 Mo'  },

  // Comptes-rendus (2)
  { id: 'd11', nom: 'CR_Comite_Pilotage_Mars_2026.docx',      meta: 'Secrétaire Général · 31/03/2026 · 345 Ko',       tag: 'Comptes-rendus', size: '345 Ko' },
  { id: 'd12', nom: 'CR_Reunion_Bailleur_Juin_2026.pdf',      meta: 'Responsable Bailleur · 20/06/2026 · 520 Ko',     tag: 'Comptes-rendus', size: '520 Ko' },

  // Photos (2)
  { id: 'd13', nom: 'Photos_Chantier_Zone_A_Mai.zip',         meta: 'Superviseur Terrain · 28/05/2026 · 45.2 Mo',     tag: 'Photos',         size: '45.2 Mo'},
  { id: 'd14', nom: 'Photos_Inauguration_Pont_03.zip',        meta: 'Communication · 10/06/2026 · 38.9 Mo',           tag: 'Photos',         size: '38.9 Mo'},

  // Études (2)
  { id: 'd15', nom: 'Etude_Impact_Environnemental.pdf',       meta: "Bureau d'Études · 15/01/2026 · 15.7 Mo",         tag: 'Études',         size: '15.7 Mo'},
  { id: 'd16', nom: 'Etude_Faisabilite_Composante_C.pdf',     meta: 'Consultant Externe · 20/02/2026 · 9.3 Mo',       tag: 'Études',         size: '9.3 Mo' },

  // Docs d'Audit (2)
  { id: 'd17', nom: 'Rapport_Audit_Financier_2025.pdf',       meta: 'Auditeur Externe · 28/02/2026 · 6.2 Mo',         tag: "Docs d'Audit",  size: '6.2 Mo' },
  { id: 'd18', nom: 'PV_Inventaire_Equipements.xlsx',         meta: 'Coordinateur Logistique · 15/04/2026 · 1.8 Mo',  tag: "Docs d'Audit",  size: '1.8 Mo' },
];

const ALL_CATEGORIES: DocCategory[] = [
  'Contrats', 'Rapports', 'TDR', "Dossiers d'AO",
  'Comptes-rendus', 'Photos', 'Études', "Docs d'Audit",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extColor(nom: string): string {
  const ext = nom.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')          return 'text-destructive';
  if (ext === 'xlsx' || ext === 'xls') return 'text-success';
  if (ext === 'docx' || ext === 'doc') return 'text-primary';
  if (ext === 'zip')          return 'text-warning';
  return 'text-muted-foreground';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024)           return `${bytes} o`;
  if (bytes < 1024 * 1024)   return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function downloadDoc(doc: Doc) {
  const content = `Fichier: ${doc.nom}\nCatégorie: ${doc.tag}\nMeta: ${doc.meta}`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.nom;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function TabDocuments() {
  const [docs,           setDocs]           = useState<Doc[]>(INITIAL_DOCS);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [activeCategory, setActiveCategory] = useState<DocCategory | null>(null);
  const [docToDelete,    setDocToDelete]    = useState<Doc | null>(null);
  const [previewDoc,     setPreviewDoc]     = useState<Doc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Category counts (dynamic) ────────────────────────────────────────────
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach(c => { counts[c] = 0; });
    docs.forEach(d => { counts[d.tag] = (counts[d.tag] ?? 0) + 1; });
    return counts;
  }, [docs]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return docs.filter(d => {
      const matchCat = activeCategory == null || d.tag === activeCategory;
      const matchQ   = !q || d.nom.toLowerCase().includes(q) || d.meta.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [docs, searchQuery, activeCategory]);

  // ── Upload ────────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const tag: DocCategory = activeCategory ?? 'Rapports';
    const newDoc: Doc = {
      id:   `doc-${Date.now()}`,
      nom:  file.name,
      meta: `Vous · Maintenant · ${formatFileSize(file.size)}`,
      tag,
      size: formatFileSize(file.size),
    };
    setDocs(prev => [newDoc, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDelete() {
    if (docToDelete) setDocs(prev => prev.filter(d => d.id !== docToDelete.id));
    setDocToDelete(null);
  }

  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Documents du Projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestion documentaire — {docs.length} fichier{docs.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Rechercher des documents…"
              className="pl-8 h-8 text-xs w-52"
              aria-label="Rechercher des documents"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            leftIcon={<Upload className="h-3.5 w-3.5" />}
            className="h-8 text-xs"
            aria-label="Uploader un document"
            onClick={() => fileInputRef.current?.click()}
          >
            Uploader Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* ── CATÉGORIES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ALL_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-card border-border hover:bg-muted/10 hover:border-primary/30 text-foreground'
              }`}
              aria-label={`Filtrer par catégorie ${cat} (${catCounts[cat] ?? 0} fichiers)`}
              aria-pressed={isActive}
              onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
            >
              <span className={`text-lg font-bold tabular-nums leading-none ${isActive ? '' : 'text-primary'}`}>
                {catCounts[cat] ?? 0}
              </span>
              <span className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}>
                {cat}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── ZONE D'UPLOAD ──────────────────────────────────────────────────── */}
      <button
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Zone de dépôt — cliquer pour parcourir les fichiers"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Glissez et déposez vos fichiers ici</p>
        <p className="text-xs text-muted-foreground">
          ou cliquez pour parcourir — PDF, Word, Excel, images jusqu'à 50 Mo
          {activeCategory && <> — sera ajouté dans <strong>{activeCategory}</strong></>}
        </p>
      </button>

      {/* ── LISTE DES DOCUMENTS ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {activeCategory ? activeCategory : 'Tous les Documents'}
          </h3>
          <div className="flex items-center gap-2">
            {activeCategory && (
              <button
                className="text-[11px] text-primary hover:underline focus-visible:outline-none"
                onClick={() => setActiveCategory(null)}
              >
                Tout afficher
              </button>
            )}
            <span className="text-xs text-muted-foreground">{filtered.length} fichier{filtered.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" aria-hidden="true" />
            <p className="text-sm">Aucun document trouvé</p>
            {searchQuery && (
              <button className="text-xs text-primary hover:underline" onClick={() => setSearchQuery('')}>
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors border-b border-border last:border-0"
              >
                {/* Icône fichier */}
                <div className="w-9 h-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                  <FileText className={`h-5 w-5 ${extColor(doc.nom)}`} aria-hidden="true" />
                </div>

                {/* Nom + méta */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{doc.nom}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.meta}</p>
                </div>

                {/* Badge catégorie */}
                <Badge variant="secondary" className="shrink-0 text-[10px] hidden sm:inline-flex">{doc.tag}</Badge>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="p-1.5 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Aperçu de ${doc.nom}`}
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Télécharger ${doc.nom}`}
                    onClick={() => downloadDoc(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-muted/10 text-destructive hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Supprimer ${doc.nom}`}
                    onClick={() => setDocToDelete(doc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Aperçu ──────────────────────────────────────────────────── */}
      <Modal open={previewDoc !== null} onOpenChange={o => { if (!o) setPreviewDoc(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Aperçu du document</ModalTitle>
            <ModalDescription>
              {previewDoc?.nom ?? ''}
            </ModalDescription>
          </ModalHeader>
          <div className="py-2">
            <div className="bg-muted/20 rounded-lg p-6 flex flex-col items-center gap-4">
              <FileText className={`h-16 w-16 ${previewDoc ? extColor(previewDoc.nom) : ''}`} aria-hidden="true" />
              <div className="text-center">
                <p className="font-medium text-foreground">{previewDoc?.nom}</p>
                <p className="text-xs text-muted-foreground mt-1">{previewDoc?.meta}</p>
                <Badge variant="secondary" className="mt-2 text-[11px]">{previewDoc?.tag}</Badge>
              </div>
            </div>
          </div>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Fermer</Button>
            </ModalClose>
            <Button variant="default" onClick={() => previewDoc && downloadDoc(previewDoc)}>
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Télécharger
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Modal Suppression ─────────────────────────────────────────────── */}
      <Modal open={docToDelete !== null} onOpenChange={o => { if (!o) setDocToDelete(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmer la suppression</ModalTitle>
            <ModalDescription>
              Voulez-vous supprimer <strong className="text-foreground">{docToDelete?.nom}</strong> ? Cette action est irréversible.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose asChild>
              <Button variant="outline">Annuler</Button>
            </ModalClose>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
