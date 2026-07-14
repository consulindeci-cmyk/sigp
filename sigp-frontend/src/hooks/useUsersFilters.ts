import { useCallback, useMemo } from 'react';
import { type ColumnFiltersState, type PaginationState } from '@tanstack/react-table';

export interface UseUsersFiltersProps {
  columnFiltersState: ColumnFiltersState;
  setColumnFiltersState: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
  setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>;
}

export interface UseUsersFiltersReturn {
  search: string;
  role: string;
  status: string;
  hasActiveFilters: boolean;
  handleSearchChange: (value: string) => void;
  handleRoleChange: (value: string) => void;
  handleStatusChange: (value: string) => void;
  handleResetFilters: () => void;
}

export function useUsersFilters({
  columnFiltersState,
  setColumnFiltersState,
  setPaginationState,
}: UseUsersFiltersProps): UseUsersFiltersReturn {
  const search = useMemo(() => {
    const f = columnFiltersState.find((col) => col.id === 'search');
    return typeof f?.value === 'string' ? f.value : '';
  }, [columnFiltersState]);

  const role = useMemo(() => {
    const f = columnFiltersState.find((col) => col.id === 'role');
    return typeof f?.value === 'string' ? f.value : 'ALL';
  }, [columnFiltersState]);

  const status = useMemo(() => {
    const f = columnFiltersState.find((col) => col.id === 'status');
    return typeof f?.value === 'string' ? f.value : 'ALL';
  }, [columnFiltersState]);

  const hasActiveFilters = useMemo(
    () => search !== '' || role !== 'ALL' || status !== 'ALL',
    [search, role, status]
  );

  const updateFilter = useCallback(
    (id: string, value: string) => {
      setColumnFiltersState((prev) => {
        const next = prev.filter((col) => col.id !== id);
        if (value !== '' && value !== 'ALL') {
          next.push({ id, value });
        }
        return next;
      });
      setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
    },
    [setColumnFiltersState, setPaginationState]
  );

  const handleSearchChange = useCallback(
    (val: string) => updateFilter('search', val),
    [updateFilter]
  );

  const handleRoleChange = useCallback(
    (val: string) => updateFilter('role', val),
    [updateFilter]
  );

  const handleStatusChange = useCallback(
    (val: string) => updateFilter('status', val),
    [updateFilter]
  );

  const handleResetFilters = useCallback(() => {
    setColumnFiltersState([]);
    setPaginationState((prev) => ({ ...prev, pageIndex: 0 }));
  }, [setColumnFiltersState, setPaginationState]);

  return {
    search,
    role,
    status,
    hasActiveFilters,
    handleSearchChange,
    handleRoleChange,
    handleStatusChange,
    handleResetFilters,
  };
}
