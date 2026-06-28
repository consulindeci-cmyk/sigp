import { flexRender } from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTablePagination } from './DataTablePagination';
import { DataTableLoading } from './DataTableLoading';
import { DataTableEmpty } from './DataTableEmpty';
import { DataTableError } from './DataTableError';
import { useDataTable } from './hooks/useDataTable';
import { DataTableProps } from './types';

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3 text-primary" />;
  return <ArrowDown className="h-3 w-3 text-primary" />;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError,
  errorMessage,
  searchKey,
  searchPlaceholder,
  filters,
  enableRowSelection,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const { table } = useDataTable({
    data,
    columns,
    enableRowSelection,
  });

  if (isError) {
    return <DataTableError message={errorMessage} />;
  }

  return (
    <div className="flex flex-col flex-1 bg-background border border-border rounded-lg shadow-sm overflow-hidden">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
      />

      {/* Main scrollable area */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]" role="region" aria-label="Tableau de données">
        {isLoading ? (
          <DataTableLoading />
        ) : data.length === 0 ? (
          <DataTableEmpty />
        ) : (
          <table className="w-full min-w-max border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b-2 border-border">
                  {headerGroup.headers.map((header, hIdx) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const meta = header.column.columnDef.meta as { align?: string; isSticky?: boolean; isStickyRight?: boolean } | undefined;
                    const align = meta?.align ?? 'left';
                    const isStickyLeft = meta?.isSticky || hIdx === 0; // Default first col is sticky
                    const isStickyRight = meta?.isStickyRight;

                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        className={cn(
                          'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap select-none',
                          canSort && 'cursor-pointer hover:text-foreground hover:bg-muted/50 transition-colors',
                          align === 'right' && 'text-right',
                          align === 'center' && 'text-center',
                          isStickyLeft && [
                            'sticky left-0 z-[6]',
                            'bg-muted/95 backdrop-blur-sm',
                            'border-r border-border',
                            'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]',
                          ],
                          isStickyRight && [
                            'sticky right-0 z-[6]',
                            'bg-muted/95 backdrop-blur-sm',
                            'border-l border-border',
                            'shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.08)]',
                          ]
                        )}
                        aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        <span className={cn('inline-flex items-center gap-1.5', align === 'right' && 'justify-end w-full', align === 'center' && 'justify-center w-full')}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && <SortIcon sorted={sorted} />}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => {
                const isEven = rowIndex % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      'group transition-colors duration-100 border-b border-border',
                      isEven ? 'bg-background' : 'bg-muted/10',
                      'hover:bg-primary/5',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => {
                      const meta = cell.column.columnDef.meta as { align?: string; isSticky?: boolean; isStickyRight?: boolean } | undefined;
                      const align = meta?.align ?? 'left';
                      const isStickyLeft = meta?.isSticky || cellIndex === 0;
                      const isStickyRight = meta?.isStickyRight;

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            'px-4 py-2.5 text-sm align-middle whitespace-nowrap',
                            align === 'right' && 'text-right',
                            align === 'center' && 'text-center',
                            isStickyLeft && [
                              'sticky left-0 z-[5]',
                              isEven ? 'bg-background' : 'bg-muted/10',
                              'group-hover:bg-primary/5',
                              'border-r border-border',
                              'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]',
                            ],
                            isStickyRight && [
                              'sticky right-0 z-[5]',
                              isEven ? 'bg-background' : 'bg-muted/10',
                              'group-hover:bg-primary/5',
                              'border-l border-border',
                              'shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]',
                            ]
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
