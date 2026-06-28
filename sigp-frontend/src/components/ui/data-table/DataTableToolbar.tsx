import { Table } from '@tanstack/react-table';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/forms/Input';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/forms/Select';
import { DataTableColumnMenu } from './DataTableColumnMenu';
import { DataTableFilter } from './types';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = 'Rechercher...',
  filters = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
      <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
        {searchKey && (
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9 h-9"
            />
          </div>
        )}

        {filters.map((filter) => {
          const column = table.getColumn(filter.id);
          if (!column) return null;
          
          return (
            <Select
              key={filter.id}
              className="h-9 min-w-[150px]"
              value={(column.getFilterValue() as string) ?? ''}
              onChange={(e) => column.setFilterValue(e.target.value)}
            >
              <option value="">{filter.title}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <DataTableColumnMenu table={table} />
      </div>
    </div>
  );
}
