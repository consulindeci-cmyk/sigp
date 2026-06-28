import React, { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import type { Contract } from '@/types/contract';
import { DataTable } from '@/components/ui/data-display/DataTable';
import { Badge } from '@/components/ui/data-display/Badge';
import { formatMoney } from '@/utils/format';

interface ContractDataTableProps {
  contracts: Contract[];
}

export const ContractDataTable: React.FC<ContractDataTableProps> = React.memo(({ contracts }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const columns = useMemo<ColumnDef<Contract, any>[]>(() => [
    {
      header: 'Identification',
      columns: [
        {
          accessorKey: 'reference',
          header: 'Réf & Objet',
          meta: { isSticky: true },
          cell: info => {
            const row = info.row.original;
            return (
              <div className="flex flex-col min-w-[220px]">
                <span className="font-semibold text-navy-800">{row.reference}</span>
                <span className="text-xs text-slate whitespace-normal">{row.intitule}</span>
              </div>
            );
          }
        },
        {
          accessorKey: 'fournisseur_id',
          header: 'Titulaire',
          cell: info => <div className="font-medium text-navy-900">{info.getValue()}</div>
        }
      ]
    },
    {
      header: 'Finances',
      columns: [
        {
          accessorKey: 'montant_initial_devise',
          header: 'Montant Contractuel',
          cell: info => {
            const row = info.row.original;
            return (
              <div className="flex flex-col items-end min-w-[140px]">
                <span className="font-mono text-navy-900 font-semibold text-right">
                  {formatMoney(info.getValue())} {row.devise_code}
                </span>
                {row.devise_code !== 'XOF' && (
                  <span className="text-xs text-slate font-mono text-right">
                    {formatMoney(row.montant_initial_base)} XOF
                  </span>
                )}
              </div>
            );
          }
        }
      ]
    },
    {
      header: 'Exécution',
      columns: [
        {
          accessorFn: row => row.date_signature,
          id: 'date_signature',
          header: 'Signature',
          cell: info => <div className="text-center">{formatDate(info.getValue())}</div>
        },
        {
          accessorFn: row => row.date_ordre_service,
          id: 'date_os',
          header: 'Ordre Service',
          cell: info => <div className="text-center font-medium">{formatDate(info.getValue())}</div>
        },
        {
          accessorFn: row => row.fin_prevue,
          id: 'fin_prevue',
          header: 'Fin Prévue',
          cell: info => <div className="text-center">{formatDate(info.getValue())}</div>
        },
        {
          accessorFn: row => row.reception_provisoire,
          id: 'reception_provisoire',
          header: 'Réc. Provisoire',
          cell: info => <div className="text-center">{formatDate(info.getValue())}</div>
        }
      ]
    },
    {
      header: 'Suivi',
      columns: [
        {
          accessorKey: 'statut',
          header: 'Statut Actuel',
          cell: info => {
            const s = info.getValue() as string;
            let variant: "default" | "secondary" | "outline" | "success" | "warning" | "destructive" = 'default';
            
            if (['EN_EXECUTION'].includes(s)) variant = 'success';
            else if (['SIGNE'].includes(s)) variant = 'warning';
            else if (['BROUILLON'].includes(s)) variant = 'secondary';
            else if (['RESILIE', 'SUSPENDU'].includes(s)) variant = 'destructive';
            else if (['TERMINE', 'CLOTURE'].includes(s)) variant = 'outline';
            
            return <Badge variant={variant}>{s.replace(/_/g, ' ')}</Badge>;
          }
        }
      ]
    }
  ], []);

  return (
    <DataTable 
      columns={columns} 
      data={contracts} 
      enableSorting={true}
      enablePagination={true}
    />
  );
});

ContractDataTable.displayName = 'ContractDataTable';
