import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Search, FolderOpen, XCircle } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/axios';

interface Document {
  id: string;
  nom: string;
  type: string;
  taille_ko: number;
  projet_nom?: string;
  cree_par: string;
  cree_le: string;
  url: string;
}

function useDocuments(search: string) {
  return useQuery({
    queryKey: ['documents', search],
    queryFn: async (): Promise<Document[]> => {
      const { data } = await api.get<Document[]>('/documents', {
        params: search ? { search } : undefined,
      });
      return data;
    },
  });
}

function formatSize(ko: number): string {
  if (ko >= 1024) return `${(ko / 1024).toFixed(1)} Mo`;
  return `${ko} Ko`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((window as typeof window & { _docSearchTimer?: ReturnType<typeof setTimeout> })._docSearchTimer);
    (window as typeof window & { _docSearchTimer?: ReturnType<typeof setTimeout> })._docSearchTimer = setTimeout(
      () => setDebouncedSearch(value),
      300
    );
  };

  const { data: documents, isLoading, error } = useDocuments(debouncedSearch);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralisez et consultez tous les documents liés aux projets.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          className="filter-select w-full pl-9 pr-3 py-2"
          placeholder="Rechercher un document…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Documents</div>
          {!isLoading && documents && (
            <span className="text-sm text-muted-foreground">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-muted border-t-foreground rounded-full animate-spin" />
            Chargement des documents…
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <XCircle className="w-10 h-10 text-destructive" />
            <p className="font-semibold text-foreground">Erreur de chargement</p>
            <p className="text-sm text-muted-foreground">Impossible de récupérer les documents.</p>
          </div>
        )}

        {!isLoading && !error && documents && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
            <p className="font-semibold text-foreground">Aucun document</p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? 'Aucun résultat pour votre recherche.' : 'Les documents apparaîtront ici une fois uploadés.'}
            </p>
          </div>
        )}

        {!isLoading && !error && documents && documents.length > 0 && (
          <div className="divide-y divide-border">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{doc.nom}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {doc.type} · {formatSize(doc.taille_ko)} · {doc.cree_par} · {formatDate(doc.cree_le)}
                      {doc.projet_nom && <> · <span className="text-primary">{doc.projet_nom}</span></>}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  download
                  className="btn flex items-center gap-1.5 text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={14} />
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
