import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { cn } from '../../../lib/utils';
import { Button } from '../forms/Button';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableSorting?: boolean;
  enablePagination?: boolean;
  className?: string;
}

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
    <div className={cn("u-stack", className)}>
      <div className="table-responsive-wrapper rounded-md border border-line bg-surface">
        <table className="table-erp">
          <thead className="bg-canvas">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSticky = (header.column.columnDef.meta as any)?.isSticky;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "sticky-header p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate",
                        isSticky && "sticky-corner bg-sticky-canvas"
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
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-line-soft hover:bg-slate-50 transition-colors">
                  {row.getVisibleCells().map((cell) => {
                    const isSticky = (cell.column.columnDef.meta as any)?.isSticky;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "p-3 text-sm text-ink align-middle",
                          isSticky && "sticky-col bg-sticky-surface border-r border-line"
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
                <td colSpan={columns.length} className="h-24 text-center text-slate">
                  Aucune donnée disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-slate">
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
