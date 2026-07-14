import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface UseDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  enableRowSelection?: boolean;
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
}

export function useDataTable<TData, TValue>({
  data,
  columns,
  enableRowSelection = false,
  manualPagination = false,
  pageCount,
  rowCount,
  pagination: externalPagination,
  onPaginationChange,
  manualSorting = false,
  sorting: externalSorting,
  onSortingChange,
  manualFiltering = false,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
}: UseDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);

  const sorting = externalSorting !== undefined ? externalSorting : internalSorting;
  const columnFilters = externalColumnFilters !== undefined ? externalColumnFilters : internalColumnFilters;
  const pagination = externalPagination !== undefined ? externalPagination : internalPagination;

  const handleSortingChange = onSortingChange ?? setInternalSorting;
  const handleColumnFiltersChange = onColumnFiltersChange ?? setInternalColumnFilters;
  const handlePaginationChange = onPaginationChange ?? setInternalPagination;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection,
    manualPagination,
    pageCount: manualPagination ? (pageCount ?? -1) : undefined,
    rowCount: manualPagination ? rowCount : undefined,
    manualSorting,
    manualFiltering,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange as any,
    onColumnFiltersChange: handleColumnFiltersChange as any,
    onPaginationChange: handlePaginationChange as any,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table };
}
