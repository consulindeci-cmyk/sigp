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
  const columnFilters = table.getState().columnFilters;
  const isFiltered = columnFilters.length > 0;

  // Accesseur sécurisé pour searchKey sans requérir de colonne virtuelle ou physique
  const getSearchValue = () => {
    if (!searchKey) return '';
    const col = table.getAllLeafColumns().find((c) => c.id === searchKey);
    if (col) {
      return (col.getFilterValue() as string) ?? '';
    }
    const f = columnFilters.find((item) => item.id === searchKey);
    return (f?.value as string) ?? '';
  };

  const handleSearchChange = (val: string) => {
    if (!searchKey) return;
    const col = table.getAllLeafColumns().find((c) => c.id === searchKey);
    if (col) {
      col.setFilterValue(val || undefined);
    } else {
      table.setColumnFilters((old) => {
        const next = old.filter((item) => item.id !== searchKey);
        if (val !== '') {
          next.push({ id: searchKey, value: val });
        }
        return next;
      });
    }
    table.setPageIndex(0);
  };

  // Accesseur sécurisé pour les filtres (rôle, statut, etc.)
  const getFilterVal = (filterId: string) => {
    const col = table.getAllLeafColumns().find((c) => c.id === filterId);
    if (col) {
      return (col.getFilterValue() as string) ?? '';
    }
    const f = columnFilters.find((item) => item.id === filterId);
    return (f?.value as string) ?? '';
  };

  const handleFilterChange = (filterId: string, val: string) => {
    const col = table.getAllLeafColumns().find((c) => c.id === filterId);
    if (col) {
      col.setFilterValue(val || undefined);
    } else {
      table.setColumnFilters((old) => {
        const next = old.filter((item) => item.id !== filterId);
        if (val !== '') {
          next.push({ id: filterId, value: val });
        }
        return next;
      });
    }
    table.setPageIndex(0);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
      <div className="flex flex-1 items-center space-x-2 flex-wrap gap-y-2">
        {searchKey && (
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={searchPlaceholder}
              value={getSearchValue()}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="pl-9 h-9"
            />
          </div>
        )}

        {filters.map((filter) => {
          return (
            <Select
              key={filter.id}
              className="h-9 min-w-[150px]"
              value={getFilterVal(filter.id)}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
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
            onClick={() => {
              table.resetColumnFilters();
              table.setPageIndex(0);
            }}
            className="h-9 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
            <X className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <DataTableColumnMenu table={table} />
      </div>
    </div>
  );
}
