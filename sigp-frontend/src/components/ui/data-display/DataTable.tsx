import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

// Extend TanStack Table meta type to support sticky columns
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    isSticky?: boolean;
  }
}
import { cn } from '@/lib/utils';
import { Button } from '../forms/Button';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableSorting?: boolean;
  enablePagination?: boolean;
  className?: string;
}

/**
 * @deprecated Use the new DataTable component from `@/components/ui/data-table/DataTable` instead.
 * This component will be removed once all modules are migrated.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  enableSorting = true,
  enablePagination = true,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(enablePagination && { getPaginationRowModel: getPaginationRowModel() }),
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="w-full overflow-hidden rounded-md border border-border bg-background">
        <div className="w-full overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSticky = header.column.columnDef.meta?.isSticky;
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 font-semibold whitespace-nowrap",
                          isSticky && "sticky left-0 z-20 bg-muted/95 backdrop-blur-sm shadow-[1px_0_0_0_hsl(var(--border))]"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    {row.getVisibleCells().map((cell) => {
                      const isSticky = cell.column.columnDef.meta?.isSticky;
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 align-middle",
                            isSticky && "sticky left-0 z-10 bg-background shadow-[1px_0_0_0_hsl(var(--border))]"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Aucune donnée disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
