declare module "react-table" {
  import { ReactNode, MouseEvent, ChangeEvent } from "react";

  export interface TableInstance<T extends object> {
    getTableProps: () => TableProps;
    getTableBodyProps: () => TableBodyProps;
    headerGroups: Array<HeaderGroup<T>>;
    rows: Array<Row<T>>;
    prepareRow: (row: Row<T>) => void;
    page: Array<Row<T>>;
    canPreviousPage: boolean;
    canNextPage: boolean;
    pageOptions: number[];
    pageCount: number;
    gotoPage: (updater: number | ((pageIndex: number) => number)) => void;
    nextPage: () => void;
    previousPage: () => void;
    setPageSize: (pageSize: number) => void;
    state: TableState<T>;
    setGlobalFilter: (filterValue: string | undefined) => void;
    preGlobalFilteredRows: Array<Row<T>>;
    globalFilteredRows: Array<Row<T>>;
    allColumns: Array<ColumnInstance<T>>;
    getToggleHideAllColumnsProps: () => TableToggleHideAllColumnsProps;
    visibleColumns: Array<ColumnInstance<T>>;
    toggleRowSelected?: (rowId?: string) => void;
    selectedFlatRows?: Array<Row<T>>;
    isAllRowsSelected?: boolean;
    toggleAllRowsSelected?: (value?: boolean) => void;
    rowsById?: Record<string, Row<T>>;
    flatRows?: Array<Row<T>>;
  }

  export interface HeaderGroup<T extends object> extends ColumnInstance<T> {
    headers: Array<ColumnInstance<T>>;
    getHeaderGroupProps: () => TableHeaderGroupProps;
    getHeaderProps: (props?: TableHeaderProps) => TableHeaderProps;
  }

  export interface ColumnInstance<T extends object> {
    id: string;
    Header: string | ((props: HeaderProps<T>) => ReactNode);
    accessor: string | ((row: T, rowIndex: number) => unknown);
    columns?: Array<ColumnInstance<T>>;
    isVisible?: boolean;
    getHeaderProps: (props?: TableHeaderProps) => TableHeaderProps;
    render: (type: "Header" | "Cell" | string, props?: object) => ReactNode;
    getToggleProps: (props?: TableToggleProps) => TableToggleProps;
    getSortByToggleProps: () => TableSortByToggleProps;
    isSorted?: boolean;
    isSortedDesc?: boolean;
    canSort?: boolean;
  }

  export interface Row<T extends object> {
    id: string;
    original: T;
    cells: Array<Cell<T>>;
    getRowProps: (props?: TableRowProps) => TableRowProps;
    isSelected?: boolean;
    canExpand?: boolean;
    isExpanded?: boolean;
    state: TableState<T>;
    subRows?: Array<Row<T>>;
  }

  export interface Cell<T extends object> {
    column: ColumnInstance<T>;
    row: Row<T>;
    value: unknown;
    getCellProps: (props?: TableCellProps) => TableCellProps;
    render: (type: string, props?: object) => ReactNode;
  }

  export interface TableProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export interface TableBodyProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export interface TableHeaderGroupProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export interface TableHeaderProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    colSpan?: number;
    onClick?: (e: MouseEvent) => void;
    [key: string]: unknown;
  }

  export interface TableRowProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: MouseEvent) => void;
    [key: string]: unknown;
  }

  export interface TableCellProps {
    role?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export interface TableToggleHideAllColumnsProps {
    type?: string;
    checked?: boolean;
    onChange?: (e: ChangeEvent) => void;
    [key: string]: unknown;
  }

  export interface TableToggleProps {
    type?: string;
    checked?: boolean;
    onChange?: (e: ChangeEvent) => void;
    [key: string]: unknown;
  }

  export interface TableSortByToggleProps {
    onClick?: (e: MouseEvent) => void;
    title?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }

  export interface TableState<T extends object> {
    pageIndex?: number;
    pageSize?: number;
    sortBy?: Array<{ id: string; desc: boolean }>;
    globalFilter?: string;
    hiddenColumns?: string[];
    selectedRowIds?: Record<string, boolean>;
    expanded?: Record<string, boolean>;
  }

  export interface HeaderProps<T extends object> {
    headerGroup: HeaderGroup<T>;
    column: ColumnInstance<T>;
  }

  export interface Column<T extends object = Record<string, unknown>> {
    Header?: string | ((props: { column: ColumnInstance<T> }) => ReactNode);
    accessor?: string | ((row: T, rowIndex: number) => unknown);
    id?: string;
    columns?: Array<Column<T>>;
    Cell?:
      | string
      | ((props: {
          row: Row<T>;
          cell: Cell<T>;
          value: unknown;
          column: ColumnInstance<T>;
        }) => ReactNode);
    width?: number | string;
    minWidth?: number;
    maxWidth?: number;
    show?: boolean;
    sortable?: boolean;
    sortType?:
      | string
      | ((a: Row<T>, b: Row<T>, columnId: string, desc: boolean) => number);
    sortDescFirst?: boolean;
    sortInverted?: boolean;
    filter?: string;
    filterValue?: unknown;
    disableFilters?: boolean;
    disableSortBy?: boolean;
    disableGlobalFilter?: boolean;
    isVisible?: boolean;
    sticky?: string;
    [key: string]: unknown;
  }

  export interface UseTableOptions<T extends object> {
    columns: Array<Column<T>>;
    data: T[];
    initialState?: Partial<TableState<T>>;
    state?: Partial<TableState<T>>;
    defaultColumn?: Partial<Column<T>>;
    getRowId?: (row: T, rowIndex: number, parent?: Row<T>) => string;
    getSubRows?: (row: T, rowIndex: number) => Array<T>;
    manualPagination?: boolean;
    pageCount?: number;
    manualSortBy?: boolean;
    manualGlobalFilter?: boolean;
    manualFilters?: boolean;
    autoResetPage?: boolean;
    autoResetExpanded?: boolean;
    autoResetGroupBy?: boolean;
    autoResetSelectedRows?: boolean;
    autoResetSortBy?: boolean;
    autoResetFilters?: boolean;
    autoResetGlobalFilter?: boolean;
    autoResetHiddenColumns?: boolean;
    autoResetResize?: boolean;
    disableSortRemove?: boolean;
    disableMultiRemove?: boolean;
    disableMultiSort?: boolean;
    disableSortBy?: boolean;
    disableGlobalFilter?: boolean;
    disableFilters?: boolean;
    disableGroupBy?: boolean;
    disableRowSelect?: boolean;
    disableRowSelectAll?: boolean;
    selectSubRows?: boolean;
  }

  export interface UseGlobalFiltersOptions {
    globalFilter?:
      | string
      | ((
          rows: Array<Row<object>>,
          columnIds: string[],
          filterValue: unknown,
        ) => Array<Row<object>>);
    filterTypes?: Record<
      string,
      (
        rows: Array<Row<object>>,
        columnIds: string[],
        filterValue: unknown,
      ) => Array<Row<object>>
    >;
    autoResetGlobalFilter?: boolean;
  }

  export interface UsePaginationOptions {
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    autoResetPage?: boolean;
  }

  export interface UseSortByOptions<T extends object> {
    sortTypes?: Record<
      string,
      (a: Row<T>, b: Row<T>, columnId: string, desc: boolean) => number
    >;
    autoResetSortBy?: boolean;
    disableSortBy?: boolean;
    disableSortRemove?: boolean;
    disableMultiRemove?: boolean;
    disableMultiSort?: boolean;
    isMultiSortEvent?: (e: MouseEvent) => boolean;
    maxMultiSortColCount?: number;
  }

  export interface UseRowSelectOptions<T extends object> {
    autoResetSelectedRows?: boolean;
    isRowSelectable?: (row: Row<T>) => boolean;
    onSelect?: (row: Row<T>) => void;
    stateReducer?: (
      newState: TableState<T>,
      action: ActionType,
      previousState: TableState<T>,
      instance?: TableInstance<T>,
    ) => TableState<T>;
  }

  export interface UseRowStateOptions<T extends object> {
    initialState?: Record<string, unknown>;
    initialRowStateAccessor?: (row: Row<T>) => unknown;
    getRowState?: (row: Row<T>) => unknown;
  }

  export type ActionType =
    | "setPageSize"
    | "gotoPage"
    | "toggleSortBy"
    | "setGlobalFilter"
    | "toggleRowSelected"
    | "toggleAllRowsSelected"
    | "setRowState"
    | "resetRowState"
    | string;

  export function useTable<T extends object>(
    options: UseTableOptions<T> &
      UseGlobalFiltersOptions &
      UsePaginationOptions &
      UseSortByOptions<T> &
      UseRowSelectOptions<T> &
      UseRowStateOptions<T>,
    ...plugins: Array<(hooks: Hooks<T>) => void>
  ): TableInstance<T>;

  export function useGlobalFilter<T extends object>(hooks: Hooks<T>): void;

  export function useFilters<T extends object>(hooks: Hooks<T>): void;

  export function useSortBy<T extends object>(
    hooks: Hooks<T>,
    options?: UseSortByOptions<T>,
  ): void;

  export function usePagination<T extends object>(
    hooks: Hooks<T>,
    options?: UsePaginationOptions,
  ): void;

  export function useRowSelect<T extends object>(
    hooks: Hooks<T>,
    options?: UseRowSelectOptions<T>,
  ): void;

  export function useRowState<T extends object>(
    hooks: Hooks<T>,
    options?: UseRowStateOptions<T>,
  ): void;

  export function useExpanded<T extends object>(hooks: Hooks<T>): void;

  export function useGroupBy<T extends object>(hooks: Hooks<T>): void;

  export function useColumnOrder<T extends object>(hooks: Hooks<T>): void;

  export function useResizeColumns<T extends object>(hooks: Hooks<T>): void;

  export function useBlockLayout<T extends object>(hooks: Hooks<T>): void;

  export function useAbsoluteLayout<T extends object>(hooks: Hooks<T>): void;

  export function useFlexLayout<T extends object>(hooks: Hooks<T>): void;

  export function useSticky<T extends object>(hooks: Hooks<T>): void;

  export const plugins: {
    useGlobalFilter: typeof useGlobalFilter;
    useFilters: typeof useFilters;
    useSortBy: typeof useSortBy;
    usePagination: typeof usePagination;
    useRowSelect: typeof useRowSelect;
    useRowState: typeof useRowState;
    useExpanded: typeof useExpanded;
    useGroupBy: typeof useGroupBy;
    useColumnOrder: typeof useColumnOrder;
    useResizeColumns: typeof useResizeColumns;
    useBlockLayout: typeof useBlockLayout;
    useAbsoluteLayout: typeof useAbsoluteLayout;
    useFlexLayout: typeof useFlexLayout;
    useSticky: typeof useSticky;
  };

  export interface Hooks<T extends object = Record<string, unknown>> {
    useGlobalFilter: typeof useGlobalFilter;
    useFilters: typeof useFilters;
    useSortBy: typeof useSortBy;
    usePagination: typeof usePagination;
    useRowSelect: typeof useRowSelect;
    useRowState: typeof useRowState;
    useExpanded: typeof useExpanded;
    useGroupBy: typeof useGroupBy;
    useColumnOrder: typeof useColumnOrder;
    useResizeColumns: typeof useResizeColumns;
    useBlockLayout: typeof useBlockLayout;
    useAbsoluteLayout: typeof useAbsoluteLayout;
    useFlexLayout: typeof useFlexLayout;
    useSticky: typeof useSticky;
    getToggleHideAllColumnsProps: () => TableToggleHideAllColumnsProps;
    state: TableState<T>;
    visibleColumns: Array<ColumnInstance<T>>;
    [key: string]: unknown;
  }

  export const defaultColumn: Partial<Column<object>>;

  export const actions: Record<string, ActionType>;
}
