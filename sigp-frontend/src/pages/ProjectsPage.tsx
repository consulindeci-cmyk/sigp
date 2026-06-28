import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { PageHeader } from '@/components/layout/AppShell';
import { Button, buttonVariants } from '@/components/ui/forms/Button';
import { StatCard } from '@/components/ui/data-display/StatCard';
import { FilterBar } from '@/components/ui/forms/FilterBar';
import { Select } from '@/components/ui/forms/Select';
import { DataTable } from '@/components/ui/data-display/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { ProgressBar } from '@/components/ui/data-display/ProgressBar';
import { cn } from '@/lib/utils';
import { Download, Plus, Filter, LayoutGrid, Activity, CheckCircle2, Banknote } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types & Mock Data
// ---------------------------------------------------------------------------
type ProjectStatus = 'En bonne voie' | 'À risque' | 'En retard' | 'Clôturé';

interface Project {
  id: string;
  code: string;
  name: string;
  donor: string;
  manager: string;
  startDate: string;
  endDate: string;
  budget: string;
  status: ProjectStatus;
  profileScore: number;
  progressScore: number;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '14',
    code: 'PROJ-014',
    name: 'Électrification Rurale Phase II',
    donor: 'AFD',
    manager: 'Hassan Diallo',
    startDate: '01/2023',
    endDate: '12/2026',
    budget: '$24.6M',
    status: 'En retard',
    profileScore: 35,
    progressScore: 76,
  },
  {
    id: '15',
    code: 'PROJ-015',
    name: 'Programme Eau Potable',
    donor: 'Banque Mondiale',
    manager: 'Sarah Koné',
    startDate: '03/2024',
    endDate: '12/2027',
    budget: '$45.2M',
    status: 'En bonne voie',
    profileScore: 15,
    progressScore: 22,
  },
  {
    id: '16',
    code: 'PROJ-016',
    name: 'Appui Agricole Nord',
    donor: 'USAID',
    manager: 'Moussa Traoré',
    startDate: '06/2022',
    endDate: '06/2025',
    budget: '$12.8M',
    status: 'À risque',
    profileScore: 65,
    progressScore: 58,
  },
  {
    id: '17',
    code: 'PROJ-017',
    name: 'Santé Maternelle',
    donor: 'Union Européenne',
    manager: 'Awa Diop',
    startDate: '01/2021',
    endDate: '12/2024',
    budget: '$18.5M',
    status: 'Clôturé',
    profileScore: 100,
    progressScore: 100,
  }
];

// ---------------------------------------------------------------------------
// ProjectsPage
// ---------------------------------------------------------------------------
export default function ProjectsPage() {
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      accessorKey: 'code',
      header: 'CODE',
      cell: ({ row }) => <span className="font-mono text-[13px] text-muted-foreground">{row.getValue('code')}</span>,
    },
    {
      accessorKey: 'name',
      header: 'NOM DU PROJET',
      cell: ({ row }) => (
        <Link to={`/projects/${row.original.id}`} className="font-semibold text-primary hover:underline">
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'donor',
      header: 'BAILLEUR',
    },
    {
      accessorKey: 'manager',
      header: 'CHEF DE PROJET',
    },
    {
      accessorKey: 'startDate',
      header: 'DATE DÉBUT',
    },
    {
      accessorKey: 'endDate',
      header: 'DATE FIN',
    },
    {
      accessorKey: 'budget',
      header: 'BUDGET',
      cell: ({ row }) => <span className="font-mono font-medium">{row.getValue('budget')}</span>,
    },
    {
      accessorKey: 'status',
      header: 'STATUT',
      cell: ({ row }) => {
        const status = row.getValue('status') as ProjectStatus;
        let variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' = 'default';
        if (status === 'En bonne voie') variant = 'success';
        if (status === 'À risque') variant = 'warning';
        if (status === 'En retard') variant = 'destructive';
        if (status === 'Clôturé') variant = 'secondary';
        
        return <Badge variant={variant} className="font-medium">{status}</Badge>;
      },
    },
    {
      accessorKey: 'profileScore',
      header: 'PROFIL',
      cell: ({ row }) => {
        const score = row.getValue('profileScore') as number;
        return <ProgressBar value={score} color="warning" size="sm" showLabel />;
      },
    },
    {
      accessorKey: 'progressScore',
      header: 'PROGRESSION',
      cell: ({ row }) => {
        const score = row.getValue('progressScore') as number;
        const color = score > 75 ? 'destructive' : score > 50 ? 'warning' : 'success';
        return <ProgressBar value={score} color={color as any} size="sm" showLabel />;
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: () => (
        <Button variant="outline" size="sm" className="rounded-md">Gérer</Button>
      ),
    },
  ], []);

  const headerActions = (
    <>
      <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
        Exporter
      </Button>
      <Link 
        to="/projects/new" 
        className={cn(buttonVariants({ variant: 'default' }), 'gap-2')}
      >
        <Plus className="h-4 w-4" /> Nouveau Projet
      </Link>
    </>
  );

  return (
    <ContentLayout>
      {/* 
        Le composant PageHeader est inséré dans les children de ContentLayout
        plutôt que dans la prop "header" pour qu'il s'affiche sans bordure blanche
        et s'aligne proprement avec le reste du contenu.
      */}
      <PageHeader 
        title="Projets" 
        subtitle="42 projets répartis sur 9 bailleurs et 14 pays" 
        actions={headerActions}
        className="mb-2"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Total des Projets</div>
          <div className="text-3xl font-semibold text-foreground">42</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Actifs</div>
          <div className="text-3xl font-semibold text-success">31</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Terminés</div>
          <div className="text-3xl font-semibold text-muted-foreground">7</div>
        </div>
        <div className="bg-background rounded-lg border border-border p-5 shadow-sm">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Budget du Portefeuille</div>
          <div className="text-3xl font-semibold text-foreground">$284.6M</div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-background border border-border rounded-lg shadow-sm p-3 flex flex-wrap gap-3 items-center">
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Bailleur : Tous</option>
            <option>Banque Mondiale</option>
            <option>Union Européenne</option>
            <option>USAID</option>
            <option>AFD</option>
            <option>PNUD</option>
          </Select>
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Pays : Tous</option>
            <option>Sénégal</option>
            <option>Côte d'Ivoire</option>
            <option>Mali</option>
            <option>Bénin</option>
            <option>Niger</option>
          </Select>
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Région : Toutes</option>
            <option>Afrique de l'Ouest</option>
            <option>Afrique Centrale</option>
            <option>Afrique de l'Est</option>
          </Select>
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Secteur : Tous</option>
            <option>Infrastructure</option>
            <option>Santé</option>
            <option>Agriculture</option>
            <option>Énergie</option>
            <option>Eau & Assainissement</option>
          </Select>
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Année : Toutes</option>
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </Select>
          <Select wrapperClassName="w-full sm:w-auto sm:min-w-[140px]" className="h-9">
            <option>Statut : Tous</option>
            <option>En bonne voie</option>
            <option>À risque</option>
            <option>En retard</option>
            <option>Clôturé</option>
          </Select>
          <div className="ml-auto w-full sm:w-auto mt-2 sm:mt-0 flex justify-end">
            <Button variant="outline" size="sm" className="h-9" leftIcon={<Filter className="h-4 w-4" />}>
              Plus de filtres
            </Button>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={MOCK_PROJECTS}
        />
      </div>
    </ContentLayout>
  );
}
