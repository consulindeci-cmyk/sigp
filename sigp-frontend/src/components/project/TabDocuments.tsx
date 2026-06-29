import { Upload, Download, FileText, MoreVertical, Search } from 'lucide-react'
import { Button }  from '@/components/ui/forms/Button'
import { Input }   from '@/components/ui/forms/Input'
import { Badge }   from '@/components/ui/data-display/Badge'

// Static Documents overview tab — summary inside the ProjectDetail view.
// Values are demonstration constants; full management is in DocumentsPage.

const DOC_CATEGORIES = [
  { label: 'Contrats',        count: 14 },
  { label: 'Rapports',        count: 22 },
  { label: 'TDR',             count: 6  },
  { label: "Dossiers d'AO",   count: 31 },
  { label: 'Comptes-rendus',  count: 18 },
  { label: 'Photos',          count: 47 },
  { label: 'Études',          count: 9  },
  { label: "Docs d'Audit",    count: 4  },
]

const SAMPLE_DOCS = [
  {
    id: 'd1',
    nom: 'Contrat_C-014-A_Signé.pdf',
    meta: 'Hassan Diallo · Hier à 14:30 · 2.4 Mo',
    tag: 'Contrats',
  },
]

export default function TabDocuments() {
  return (
    <div className="flex flex-col gap-4 bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h1 className="text-base font-bold text-foreground">Documents du Projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Gestion documentaire — 152 fichiers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Rechercher des documents…"
              className="pl-8 h-8 text-xs w-52"
              aria-label="Rechercher des documents"
            />
          </div>
          <Button
            variant="default"
            size="sm"
            leftIcon={<Upload className="h-3.5 w-3.5" />}
            className="h-8 text-xs"
            aria-label="Uploader un document"
          >
            Uploader Document
          </Button>
        </div>
      </div>

      {/* ── CATÉGORIES ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {DOC_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              i === 0
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border hover:bg-muted/10 hover:border-primary/30 text-foreground'
            }`}
            aria-label={`Filtrer par catégorie ${cat.label} (${cat.count} fichiers)`}
            aria-pressed={i === 0}
          >
            <span className={`text-lg font-bold tabular-nums leading-none ${i === 0 ? '' : 'text-primary'}`}>
              {cat.count}
            </span>
            <span className={`text-[10px] leading-tight mt-0.5 ${i === 0 ? 'opacity-80' : 'text-muted-foreground'}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── ZONE D'UPLOAD ──────────────────────────────────────────────────── */}
      <button
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Zone de dépôt — cliquer pour parcourir les fichiers"
      >
        <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Glissez et déposez vos fichiers ici</p>
        <p className="text-xs text-muted-foreground">
          ou cliquez pour parcourir — PDF, Word, Excel, images jusqu'à 50 Mo
        </p>
      </button>

      {/* ── LISTE DES DOCUMENTS ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-muted/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Tous les Documents</h3>
          <span className="text-xs text-muted-foreground">152 fichiers</span>
        </div>

        <div>
          {SAMPLE_DOCS.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors border-b border-border last:border-0"
            >
              {/* Icône fichier */}
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>

              {/* Nom + méta */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{doc.nom}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.meta}</p>
              </div>

              {/* Badge catégorie */}
              <Badge variant="secondary" className="shrink-0 text-[10px]">{doc.tag}</Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="p-1.5 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Télécharger ${doc.nom}`}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
