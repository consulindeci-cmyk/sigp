import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/forms/Checkbox';
import { Badge } from '@/components/ui/data-display/Badge';
import { MoreHorizontal, AlertTriangle, CheckCircle2, Clock, XCircle, MinusCircle, Edit, Eye } from 'lucide-react';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { Contract, ContractStatus } from '@/types/contract';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays/DropdownMenu';
import { Button } from '@/components/ui/forms/Button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function getStatusConfig(status: ContractStatus): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'default';
  label: string;
  icon: React.ElementType;
} {
  switch (status) {
    case 'EN_EXECUTION':
      return { variant: 'success', label: 'En Exécution', icon: CheckCircle2 };
    case 'SIGNE':
      return { variant: 'warning', label: 'Signé', icon: Clock };
    case 'BROUILLON':
      return { variant: 'secondary', label: 'Brouillon', icon: MinusCircle };
    case 'SUSPENDU':
      return { variant: 'destructive', label: 'Suspendu', icon: AlertTriangle };
    case 'RESILIE':
      return { variant: 'destructive', label: 'Résilié', icon: XCircle };
    case 'TERMINE':
      return { variant: 'default', label: 'Terminé', icon: CheckCircle2 };
    case 'CLOTURE':
      return { variant: 'default', label: 'Clôturé', icon: CheckCircle2 };
    default:
      return { variant: 'default', label: status, icon: MinusCircle };
  }
}

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ---------------------------------------------------------------------------
// Columns Configuration
// ---------------------------------------------------------------------------

interface GetContractColumnsOptions {
  onEdit?: (contract: Contract) => void;
  onView?: (contract: Contract) => void;
}

export function getContractColumns({ onEdit, onView }: GetContractColumnsOptions = {}): ColumnDef<Contract, any>[] {
  return [
    // ── Sélection ────────────────────────────────────────────────────────
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(value)}
          aria-label="Sélectionner tout"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(value)}
          aria-label="Sélectionner la ligne"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      meta: { isSticky: true, align: 'center' } as any,
    },
    // ── Colonne 1 : Sticky — Référence & Intitulé ──────────────────────────
    {
      id: 'identification',
      accessorKey: 'reference',
      header: 'Réf. & Intitulé',
      enableSorting: true,
      meta: { isSticky: true } as any,
      cell: ({ row }) => {
        const { reference, intitule } = row.original;
        return (
          <div className="flex flex-col gap-0.5 min-w-[200px] max-w-[280px]">
            <span className="font-semibold text-foreground text-[13px] font-mono tracking-tight">
              {reference}
            </span>
            <span
              className="text-[11px] text-muted-foreground leading-snug line-clamp-2 whitespace-normal"
              title={intitule}
            >
              {intitule}
            </span>
          </div>
        );
      },
    },
    // ── Statut ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'statut',
      header: 'Statut',
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue() as ContractStatus;
        const { variant, label, icon: Icon } = getStatusConfig(status);
        return (
          <Badge variant={variant} className="flex items-center gap-1 w-max text-[11px] font-semibold">
            <Icon className="h-3 w-3 shrink-0" />
            {label}
          </Badge>
        );
      },
    },
    // ── Fournisseur / Titulaire ─────────────────────────────────────────────
    {
      accessorKey: 'fournisseur_id',
      header: 'Titulaire',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-foreground text-[13px] font-medium">
          {getValue() as string || '—'}
        </span>
      ),
    },
    // ── Bailleur ────────────────────────────────────────────────────────────
    {
      accessorKey: 'bailleur_id',
      header: 'Bailleur',
      enableSorting: true,
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-[12px]">
          {getValue() as string || '—'}
        </span>
      ),
    },
    // ── Imputation (WBS, PPM, Budget) ───────────────────────────────────────
    {
      id: 'imputation',
      header: 'Imputation (WBS/Budget)',
      enableSorting: false,
      cell: ({ row }) => {
        const { wbs_id, budget_ligne_id, ppm_ligne_id } = row.original;
        return (
          <div className="flex flex-col gap-1">
            {wbs_id && <Badge variant="outline" className="text-[10px] w-max">WBS: {wbs_id}</Badge>}
            {budget_ligne_id && <Badge variant="outline" className="text-[10px] w-max">BDG: {budget_ligne_id}</Badge>}
            {ppm_ligne_id && <Badge variant="outline" className="text-[10px] w-max">PPM: {ppm_ligne_id}</Badge>}
            {!wbs_id && !budget_ligne_id && !ppm_ligne_id && <span className="text-muted-foreground text-xs">—</span>}
          </div>
        );
      },
    },
    // ── Montant contractuel ─────────────────────────────────────────────────
    {
      accessorKey: 'montant_initial_devise',
      header: 'Montant Contractuel',
      enableSorting: true,
      meta: { align: 'right' } as any,
      cell: ({ row }) => {
        const { montant_initial_devise, montant_initial_base, devise_code } = row.original;
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-mono text-[13px] font-semibold text-foreground">
              {formatMoney(montant_initial_devise)}&nbsp;
              <span className="text-[11px] font-bold text-primary">{devise_code}</span>
            </span>
            {devise_code !== 'XOF' && montant_initial_base && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {formatMoney(montant_initial_base)} XOF
              </span>
            )}
          </div>
        );
      },
    },
    // ── Devise ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'devise_code',
      header: 'Devise',
      enableSorting: false,
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {getValue() as string}
        </span>
      ),
    },
    // ── Date Signature ─────────────────────────────────────────────────────
    {
      accessorKey: 'date_signature',
      header: 'Signature',
      enableSorting: true,
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    // ── Ordre de Service ───────────────────────────────────────────────────
    {
      accessorKey: 'date_ordre_service',
      header: 'Ordre de Service',
      enableSorting: true,
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] font-semibold text-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    // ── Fin Prévue ─────────────────────────────────────────────────────────
    {
      accessorKey: 'fin_prevue',
      header: 'Fin Prévue',
      enableSorting: true,
      meta: { align: 'center' } as any,
      cell: ({ row }) => {
        const date = row.original.fin_prevue;
        const overdue = row.original.statut === 'EN_EXECUTION' && isOverdue(date);
        return (
          <span className={cn(
            'font-mono text-[12px]',
            overdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
          )}>
            {formatDate(date)}
            {overdue && <AlertTriangle className="inline h-3 w-3 ml-1 text-destructive" />}
          </span>
        );
      },
    },
    // ── Réception Provisoire ───────────────────────────────────────────────
    {
      accessorKey: 'reception_provisoire',
      header: 'Réc. Provisoire',
      enableSorting: true,
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => (
        <span className="font-mono text-[12px] text-muted-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
    },
    // ── Garanties ─────────────────────────────────────────────────────────
    {
      accessorKey: 'retenue_garantie_taux',
      header: 'Ret. Garantie',
      enableSorting: false,
      meta: { align: 'right' } as any,
      cell: ({ getValue }) => {
        const val = getValue() as number | undefined;
        return (
          <span className="font-mono text-[12px] text-muted-foreground">
            {val != null ? `${val}%` : '—'}
          </span>
        );
      },
    },
    // ── Expiration Garantie ────────────────────────────────────────────────
    {
      accessorKey: 'date_expiration_garantie',
      header: 'Exp. Garantie',
      enableSorting: true,
      meta: { align: 'center' } as any,
      cell: ({ getValue }) => {
        const date = getValue() as string | undefined;
        const expired = isOverdue(date);
        return (
          <span className={cn(
            'font-mono text-[12px]',
            expired ? 'text-warning font-semibold' : 'text-muted-foreground'
          )}>
            {formatDate(date)}
          </span>
        );
      },
    },
    // ── Actions (Sticky Right) ──────────────────────────────────────────────
    {
      id: 'actions',
      enableHiding: false,
      meta: { isStickyRight: true, align: 'center' } as any,
      cell: ({ row }) => {
        const contract = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView?.(contract)}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(contract)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
