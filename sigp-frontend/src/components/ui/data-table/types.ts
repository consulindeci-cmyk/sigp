import React from 'react';
import { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilter {
  id: string; // The accessor key of the column to filter
  title: string;
  options: DataTableFilterOption[];
}

export interface DataTableAction<TData> {
  id: string;
  label: string;
  icon?: React.ReactNode | any;
  onClick: (row: TData) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  
  // States
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  
  // Toolbar features
  searchKey?: string; // Column id to search globally (e.g. 'reference')
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
  
  // Configuration
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableColumnOrdering?: boolean;
  
  // Server-side (manual) operations support
  manualPagination?: boolean;
  pageCount?: number;
  rowCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState | ((old: PaginationState) => PaginationState)) => void;
  
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState | ((old: SortingState) => SortingState)) => void;
  
  manualFiltering?: boolean;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => void;
  
  // Callbacks
  onRowClick?: (row: TData) => void;
  
// Global Actions Menu (Bulk)
  bulkActions?: DataTableAction<TData[]>[];
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: 'left' | 'center' | 'right';
    isSticky?: boolean;
    isStickyRight?: boolean;
  }
}

