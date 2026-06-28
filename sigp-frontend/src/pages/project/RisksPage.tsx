import { useParams } from 'react-router-dom';
import { useRisks } from '@/hooks/useRisks';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table/DataTable';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';

// Données démo utilisées si l'API est vide
const DUMMY_RISQUES = [
  { id: '1', categorie: 'Fiduciaire', description: 'Corruption', probabilite: 1, impact: 3, criticite: 3, plan_mitigation: 'Audits annuels', responsable: 'Financier' },
  { id: '2', categorie: 'Opérationnel', description: 'Retard chantiers', probabilite: 3, impact: 2, criticite: 6, plan_mitigation: 'Suivi hebdo', responsable: 'Chef projet' },
  { id: '3', categorie: 'Climatique', description: 'Sécheresse', probabilite: 2, impact: 3, criticite: 6, plan_mitigation: 'Plan urgence', responsable: 'Coordination' }
];

// Matrice demandée : PxI
const MATRIX = [
  [{ v: 1, c: '#16A34A' }, { v: 2, c: '#16A34A' }, { v: 3, c: '#F97316' }],
  [{ v: 2, c: '#16A34A' }, { v: 4, c: '#F97316' }, { v: 6, c: '#DC2626' }],
  [{ v: 3, c: '#F97316' }, { v: 6, c: '#DC2626' }, { v: 9, c: '#DC2626' }]
];

type RiskData = {
  id: string;
  categorie: string;
  description: string;
  probabilite: number;
  impact: number;
  criticite: number;
  plan_mitigation: string;
  responsable: string;
};

export default function RisksPage() {
  const { id: projectId = '' } = useParams();
  const { data: risksData, isLoading } = useRisks(projectId);

  const columns = useMemo<ColumnDef<RiskData>[]>(() => [
    {
      accessorKey: 'categorie',
      header: 'CATÉGORIE',
    },
    {
      accessorKey: 'description',
      header: 'RISQUE',
      cell: ({ row }) => <span className="font-medium whitespace-normal leading-relaxed">{row.getValue('description')}</span>,
    },
    {
      accessorKey: 'probabilite',
      header: 'P',
      meta: { align: 'center' },
    },
    {
      accessorKey: 'impact',
      header: 'I',
      meta: { align: 'center' },
    },
    {
      accessorKey: 'criticite',
      header: 'CRITICITÉ',
      meta: { align: 'center' },
      cell: ({ row }) => <span className="font-bold text-lg text-foreground">{row.getValue('criticite')}</span>,
    },
    {
      accessorKey: 'plan_mitigation',
      header: 'ATTÉNUATION',
      cell: ({ row }) => <span className="whitespace-normal leading-relaxed">{row.getValue('plan_mitigation')}</span>,
    },
    {
      accessorKey: 'responsable',
      header: 'RESPONSABLE',
    },
  ], []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Utilisation des données de l'API si disponibles, sinon Fallback démo
  const rawRisques = risksData?.data ?? [];
  
  const displayData: RiskData[] = rawRisques.length > 0 
    ? rawRisques.map((r: any) => ({
        id: r.id,
        categorie: r.categorie.charAt(0) + r.categorie.slice(1).toLowerCase(),
        description: r.description,
        probabilite: r.probabilite,
        impact: r.impact,
        criticite: r.criticite || (r.probabilite * r.impact),
        plan_mitigation: r.plan_mitigation || '—',
        responsable: r.responsable || '—'
      }))
    : DUMMY_RISQUES;

  return (
    <ContentLayout>
      <PageHeader 
        title="Matrice des risques" 
        subtitle="Identifier, noter, prioriser et suivre les risques fiduciaires, opérationnels et stratégiques."
        className="mb-8"
      />

      {/* 2. Deux cartes côte à côte */}
      <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-6 mb-6">
        
        {/* Carte a) Matrice PxI */}
        <div className="bg-background rounded-lg shadow-sm border border-border p-8 flex flex-col items-center self-start">
          <h3 className="w-full text-lg font-semibold text-foreground mb-8 text-left">
            Carte criticité : Probabilité × Impact
          </h3>
          
          <div className="flex items-center gap-4">
            {/* Label vertical gauche */}
            <div 
              className="text-sm font-bold text-muted-foreground tracking-widest rotate-180" 
              style={{ writingMode: 'vertical-rl' }}
            >
              Probabilité ↑
            </div>
            
            {/* Grille */}
            <div className="flex flex-col gap-3">
              {MATRIX.map((row, i) => (
                <div key={i} className="flex gap-3">
                  {row.map((cell, j) => (
                    <div 
                      key={j} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-sm transition-transform hover:scale-105"
                      style={{ backgroundColor: cell.c }}
                    >
                      {cell.v}
                    </div>
                  ))}
                </div>
              ))}
              
              {/* Label bas */}
              <div className="text-sm font-bold text-muted-foreground text-center tracking-widest mt-2">
                Impact →
              </div>
            </div>
          </div>
        </div>

        {/* Carte b) Tableau */}
        <div className="bg-background rounded-lg shadow-sm border border-border flex flex-col h-full overflow-hidden">
          <div className="p-5 flex-1">
            <DataTable 
              columns={columns} 
              data={displayData} 
            />
          </div>
        </div>
      </div>

      {/* 3. Encart d'alerte */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 flex items-start gap-4">
        <div>
          <h4 className="text-warning font-semibold text-lg mb-1">Alerte automatique</h4>
          <p className="text-warning/80 text-sm font-medium">
            Si criticité ≥ 6 : notification au chef de projet et demande de plan d'action.
          </p>
        </div>
      </div>

    </ContentLayout>
  );
}
