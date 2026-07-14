import { useState, useMemo } from 'react';
import {
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useUsers } from '@/hooks/useUsers';
import { type UserRole, type UserRow } from '@/lib/userAdapter';

export interface UseUsersTableReturn {
  users: UserRow[];
  pageCount: number;
  rowCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  paginationState: PaginationState;
  setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>;
  sortingState: SortingState;
  setSortingState: React.Dispatch<React.SetStateAction<SortingState>>;
  columnFiltersState: ColumnFiltersState;
  setColumnFiltersState: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
}

export function useUsersTable(): UseUsersTableReturn {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sortingState, setSortingState] = useState<SortingState>([]);
  const [columnFiltersState, setColumnFiltersState] = useState<ColumnFiltersState>([]);

  const queryParams = useMemo(() => {
    const searchFilter = columnFiltersState.find((f) => f.id === 'search');
    const search =
      typeof searchFilter?.value === 'string' && searchFilter.value.trim() !== ''
        ? searchFilter.value.trim()
        : undefined;

    const roleFilter = columnFiltersState.find((f) => f.id === 'role');
    const role =
      typeof roleFilter?.value === 'string' &&
      roleFilter.value !== '' &&
      roleFilter.value !== 'ALL'
        ? (roleFilter.value as UserRole)
        : undefined;

    const statusFilter = columnFiltersState.find((f) => f.id === 'status');
    const status =
      typeof statusFilter?.value === 'string' &&
      statusFilter.value !== '' &&
      statusFilter.value !== 'ALL'
        ? (statusFilter.value as 'active' | 'inactive')
        : undefined;

    const sortField = sortingState[0]?.id;
    const sortOrder: 'desc' | 'asc' | undefined = sortingState[0]?.desc
      ? 'desc'
      : sortingState[0]
        ? 'asc'
        : undefined;

    return { search, role, status, sortField, sortOrder };
  }, [columnFiltersState, sortingState]);

  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useUsers({
    page: paginationState.pageIndex + 1,
    limit: paginationState.pageSize,
    search: queryParams.search,
    sortBy: queryParams.sortField,
    sortOrder: queryParams.sortOrder,
    role: queryParams.role,
    status: queryParams.status,
  });

  const users = useMemo(() => usersData?.data ?? [], [usersData?.data]);
  const pageCount = usersData?.meta?.totalPages ?? 1;
  const rowCount = usersData?.meta?.total ?? users.length;

  return {
    users,
    pageCount,
    rowCount,
    isLoading,
    isError,
    error,
    paginationState,
    setPaginationState,
    sortingState,
    setSortingState,
    columnFiltersState,
    setColumnFiltersState,
  };
}
