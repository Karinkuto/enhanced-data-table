import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TableToolbar } from "@/components/data-table/table-toolbar"
import { TableFooter } from "@/components/data-table/table-footer"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type Row,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, MoreVertical, FileDownIcon, UserPlusIcon, UserMinusIcon } from "lucide-react"
import { useState, useEffect, useTransition } from "react"
import {
  DropdownMenu,  
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
// Replace problematic import with a local implementation
// import { useMobile } from "@/hooks/use-mobile"
import { MobileDataView, } from "@/components/data-table/mobile-data-view"
import { toast } from "sonner"
import React, { useMemo } from "react"
import { Trash } from "lucide-react"
import { fuzzyFilter } from "@/lib/fuzzy-filter"
import { FloatingSelectionController } from "./floating-selection-controller"
import { Skeleton } from "@/components/ui/skeleton"
import {
  multiColumnFilterFn,
  categoryFilterFn,
} from "@/lib/filters";

// Extend the ColumnMeta interface with our additional properties
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    cellClassName?: string;
    showBorder?: boolean;
  }
}

// Define custom filter functions
declare module "@tanstack/react-table" {
  interface FilterFns {
    multiColumn: FilterFn<unknown>
    category: FilterFn<unknown>
  }
}

// Row action type for kebab menu
export interface RowAction<TData> {
  label: string
  icon?: React.ReactNode
  onClick: (row: TData) => void
}

export interface SearchableColumn {
  id: string
  label: string
}

export interface MobileViewConfig {
  // Column ID to use as the primary header in mobile view
  headerColumnId?: string;
  // Column IDs to use in the subheader in mobile view
  subheaderColumnIds?: string[];
  // Column IDs to exclude from detail rows in mobile view
  excludeFromDetailColumns?: string[];
  // Custom labels for mobile view columns
  columnLabels?: Record<string, string>;
}

export interface BatchAction<TData> {
  label: string;
  icon: React.ReactNode;
  onClick: (selectedRows: TData[]) => Promise<void> | void;
  hotkey?: string;
}

// New: TableState type for server-side mode
export type DataTableState = {
  pagination: PaginationState;
  filters: ColumnFiltersState;
  sorting: SortingState;
  search: string;
};

export interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  onDeleteRows?: (rows: TData[]) => void
  onAddItem?: () => void
  addButtonText?: string
  searchPlaceholder?: string
  searchColumnId?: string
  initialPageSize?: number
  pageSizeOptions?: number[]
  initialSorting?: SortingState
  rowActions?: RowAction<TData>[]
  searchableColumns?: SearchableColumn[]
  // Mobile view configuration
  mobileViewConfig?: MobileViewConfig
  // Custom batch actions for mobile view
  mobileBatchActions?: BatchAction<TData>[]
  // Server-side mode
  serverSide?: boolean
  state?: DataTableState
  onStateChange?: (state: DataTableState) => void
  loading?: boolean
}

// Create a type for the cell to avoid 'any' type
type DataTableCell<TData> = ReturnType<Row<TData>['getVisibleCells']>[number];

import { useIsMobile } from "@/hooks/useIsMobile";

export function DataTable<TData>({
  data,
  columns,
  onDeleteRows,
  onAddItem,
  addButtonText = "Add item",
  searchPlaceholder = "Search...",
  searchColumnId = "all",
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  initialSorting,
  rowActions,
  searchableColumns,
  mobileViewConfig,
  mobileBatchActions,
  serverSide = false,
  state,
  onStateChange,
  loading = false,
}: DataTableProps<TData>) {

  const isMobile = useIsMobile(768);

  // Controlled/uncontrolled state logic
  // Internal state for client-side mode
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
  const defaultSorting = initialSorting ?? (columns.length > 0 && columns[0].id ? [{
    id: columns[0].id,
    desc: false,
  }]
   : []);
  const [internalSorting, setInternalSorting] = useState<SortingState>(defaultSorting);
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({});
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [internalSearchValue, setInternalSearchValue] = useState<string>("");

  // Use controlled state if serverSide, otherwise use internal state
  const pagination = serverSide && state ? state.pagination : internalPagination;
  const columnFilters = serverSide && state ? state.filters : internalColumnFilters;
  const sorting = serverSide && state ? state.sorting : internalSorting;
  const searchValue = serverSide && state ? state.search : internalSearchValue;

  // Setters: call onStateChange if serverSide, otherwise update internal state
  // Helpers to handle both value and updater function for TanStack Table's OnChangeFn
  function handleControlledChange<T>(
    current: T,
    updaterOrValue: T | ((old: T) => T),
    key: keyof DataTableState
  ) {
    const newValue = typeof updaterOrValue === "function"
      ? (updaterOrValue as (old: T) => T)(current)
      : updaterOrValue;
    onStateChange?.({ ...state!, [key]: newValue });
  }

  const setPagination = serverSide && onStateChange
    ? (p: PaginationState | ((old: PaginationState) => PaginationState)) =>
        handleControlledChange<PaginationState>(
          pagination,
          p,
          "pagination"
        )
    : setInternalPagination;

  const setColumnFilters = serverSide && onStateChange
    ? (f: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) =>
        handleControlledChange<ColumnFiltersState>(
          columnFilters,
          f,
          "filters"
        )
    : setInternalColumnFilters;

  const setSorting = serverSide && onStateChange
    ? (s: SortingState | ((old: SortingState) => SortingState)) =>
        handleControlledChange<SortingState>(
          sorting,
          s,
          "sorting"
        )
    : setInternalSorting;
  const setSearchValue = serverSide && onStateChange
    ? (s: string) => onStateChange({ ...state!, search: s })
    : setInternalSearchValue;
  const setColumnVisibility = setInternalColumnVisibility; // always internal

  // Selection state and batch action handling
  const [isPending, startTransition] = useTransition()
  const [currentAction, setCurrentAction] = useState<string | null>(null)

  // Default searchable columns setup
  const defaultSearchableColumns = useMemo(() => {
    if (searchableColumns?.length) {
      return searchableColumns
    }
    return columns.reduce((cols: SearchableColumn[], col) => {
      if (col.id && typeof col.id === "string" && col.id !== "select" && col.id !== "actions") {
        cols.push({
          id: col.id,
          label: col.header ? String(col.header) : col.id,
        })
      }
      return cols
    }, [])
  }, [searchableColumns, columns])
  
  // For mobile views, always use "all" as the search column
  const [selectedSearchColumn, setSelectedSearchColumn] = useState<string>(
    isMobile ? "all" : (searchColumnId || "all")
  )

  // Reset to "all" search if switching to mobile
  useEffect(() => {
    if (isMobile && selectedSearchColumn !== "all") {
      setSelectedSearchColumn("all")
    }
  }, [isMobile, selectedSearchColumn])

  // Use a typed version of the fuzzy filter for this component
  const typedFuzzyFilter: FilterFn<TData> = (row, columnId, value, addMeta) => {
    return fuzzyFilter(row, columnId, value, addMeta);
  };

  const table = useReactTable<TData>({
    data, 
    columns: columns as ColumnDef<TData, unknown>[], 
    
    getCoreRowModel: getCoreRowModel(), 
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,

    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: {
      multiColumn: multiColumnFilterFn as FilterFn<TData>,
      category: categoryFilterFn as FilterFn<TData>,
      fuzzy: typedFuzzyFilter,
    },
    globalFilterFn: typedFuzzyFilter,
    state: { 
      sorting,
      pagination, 
      columnFilters,
      columnVisibility: internalColumnVisibility,
      globalFilter: selectedSearchColumn === "all" ? searchValue : undefined,
    },
    manualPagination: serverSide,
    manualFiltering: serverSide,
    manualSorting: serverSide,
  })

  // When search column or value changes, update the column filters
  useEffect(() => {
    if (searchValue) {
      if (selectedSearchColumn === "all") {
        // For "all" column search, use the globalFilter
        table.setGlobalFilter(searchValue)
        // Clear column filters when using global filter
        table.setColumnFilters([])
      } else if (selectedSearchColumn) {
        // For specific column search, use column filters
        table.setGlobalFilter(undefined) // Clear global filter
        table.setColumnFilters([{
          id: selectedSearchColumn,
          value: searchValue
        }])
      }
    } else {
      // Clear all filters when search is empty
      table.setGlobalFilter(undefined)
      table.setColumnFilters([])
    }
  }, [selectedSearchColumn, searchValue, table])

  // Default mobile view config
  const defaultMobileViewConfig: MobileViewConfig = {
    headerColumnId: "name",
    subheaderColumnIds: ["email", "location"],
    excludeFromDetailColumns: ["name", "email", "location", "select", "actions"],
    columnLabels: {},
  }

  // Merge user config with defaults
  const mobileConfig = { ...defaultMobileViewConfig, ...mobileViewConfig }

  // Render functions for mobile views
  const renderHeader = (row: Row<TData>) => {
    let cell: DataTableCell<TData> | undefined;
    
    // Use configured header column if available and visible
    if (mobileConfig.headerColumnId) {
      const headerColumn = columns.find((col) => {
        return col.id === mobileConfig.headerColumnId && 
               col.id !== undefined && 
               table.getColumn(col.id)?.getIsVisible();
      });
      if (headerColumn?.id) {
        cell = row.getVisibleCells().find((c) => c.column.id === headerColumn.id);
      }
    }
    
    // Fallback to first visible cell that's not select or actions
    if (!cell) {
      cell = row.getVisibleCells().find(
        (c) => c.column.id !== "select" && c.column.id !== "actions"
      );
    }
  
    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : null;
  };

  const renderSubheader = (row: Row<TData>) => {
    const visibleCells = row.getVisibleCells();
    const subheaderCells = (mobileConfig.subheaderColumnIds || [])
      .map(id => visibleCells.find(cell => cell.column.id === id))
      .filter(cell => cell !== undefined) as typeof visibleCells;
    
    // If no subheader cells configured or found, return null
    if (subheaderCells.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 items-center">
        {subheaderCells.map((cell, index) => (
          <React.Fragment key={cell.column.id}>
            <div className="inline-flex items-center">
              <span className="text-xs font-medium text-muted-foreground mr-1.5 capitalize">
                {cell.column.id}:
              </span>
              <span className="text-sm">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </span>
            </div>
            {index < subheaderCells.length - 1 && (
              <span className="text-muted-foreground/30 hidden last:hidden xs:inline-block">•</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderDetailRows = (row: Row<TData>) => {
    const excludeIds = mobileConfig.excludeFromDetailColumns || ["select", "actions"];
    
    return row
      .getVisibleCells()
      .filter(cell => !excludeIds.includes(cell.column.id))
      .map((cell) => {
        const columnLabel = mobileConfig.columnLabels?.[cell.column.id] || 
          (typeof cell.column.columnDef.header === "string"
            ? cell.column.columnDef.header
            : cell.column.id.charAt(0).toUpperCase() + cell.column.id.slice(1));

        return (
          <React.Fragment key={cell.column.id}>
            <TableCell className="bg-muted/20 py-3 px-3 font-medium w-1/3 min-w-[100px] max-w-[120px] border-r border-border whitespace-normal break-words">
              {columnLabel}
            </TableCell>
            <TableCell className="py-3 px-3 w-2/3 overflow-hidden break-words">
              {String(cell.getValue())}
            </TableCell>
          </React.Fragment>
        );
      });
  };

  // Create batch actions for mobile view with default values if not provided
  const defaultBatchActions = [
    {
      label: "Export",
      icon: <FileDownIcon className="h-3.5 w-3.5" />,
      onClick: () => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        navigator.clipboard.writeText(JSON.stringify(selectedRows, null, 2));
        toast.info("Selected rows copied to clipboard");
      },
      hotkey: "alt+e"
    },
    {
      label: "Activate",
      icon: <UserPlusIcon className="h-3.5 w-3.5" />,
      onClick: () => {
        toast.info("Activate selected rows");
      },
      hotkey: "alt+a"
    },
    {
      label: "Deactivate",
      icon: <UserMinusIcon className="h-3.5 w-3.5" />,
      onClick: () => {
        toast.info("Deactivate selected rows");
      },
      hotkey: "alt+d"
    },
    {
      label: "Delete",
      icon: <Trash className="h-3.5 w-3.5" />,
      onClick: () => {
        if (onDeleteRows) {
          const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
          onDeleteRows(selectedRows);
          toast.success(`Deleted ${selectedRows.length} ${selectedRows.length === 1 ? "row" : "rows"}`);
        } else {
          toast.info("Delete selected rows");
        }
      },
      hotkey: "delete"
    },
  ];

  // Map custom batch actions
  const batchActions = mobileBatchActions 
    ? mobileBatchActions.map(action => ({
        label: action.label,
        icon: action.icon,
        onClick: () => {
          const selectedRows = table.getSelectedRowModel().rows
            .map(row => row.original);
          return action.onClick(selectedRows);
        },
        hotkey: action.hotkey
      }))
    : defaultBatchActions;

  // Handle batch action for both mobile and desktop
  const handleBatchAction = (action: { 
    label: string
    icon: React.ReactNode
    onClick: (selectedIds: string[]) => Promise<void> | void 
    hotkey?: string
  }) => {
    setCurrentAction(action.label)
    startTransition(async () => {
      try {
        const selectedIds = table.getSelectedRowModel().rows.map(row => row.id)
        await action.onClick(selectedIds)
        
        // Clear selection after action is completed
        table.toggleAllRowsSelected(false)
      } catch (error) {
        toast.error("An error occurred")
        console.error(error)
      } finally {
        setCurrentAction(null)
      }
    })
  }

  // Functions to handle selection in desktop view
  const selectAll = () => {
    table.toggleAllRowsSelected(true)
    toast.success("All items selected", { duration: 1500, position: "top-center" })
  }

  const deselectAll = () => {
    table.toggleAllRowsSelected(false)
    toast.info("Selection cleared", { duration: 1500, position: "top-center" })
  }

  // Get the selected rows for both views
  const selectedRowCount = table.getSelectedRowModel().rows.length
  const allRowIds = table.getRowModel().rows.map(row => row.id)
  const selectedRowIds = table.getSelectedRowModel().rows.map(row => row.id)

  // If we're on mobile, render the MobileDataView
  if (isMobile) {
    return (
      <div className="space-y-4">
        <TableToolbar 
          table={table}
          searchColumnId={selectedSearchColumn}
          onSearchColumnChange={setSelectedSearchColumn}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          searchPlaceholder={searchPlaceholder}
          onAddItem={onAddItem}
          onDeleteRows={onDeleteRows}
          addButtonText={addButtonText}
          searchableColumns={defaultSearchableColumns}
          showColumnSelection={false} // Always hide column selection on mobile
        />
        
        <MobileDataView
          data={table.getRowModel().rows}
          renderHeader={renderHeader}
          renderSubheader={renderSubheader}
          renderDetailRows={renderDetailRows}
          batchActions={batchActions}
          onRowAction={rowActions ? (row) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuGroup>
                  {rowActions.map((action) => (
                    <DropdownMenuItem
                      key={`row-action-${action.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(row.original);
                        // Clear the selection state after action is completed
                        if (row.getIsSelected()) {
                          row.toggleSelected(false);
                        }
                        toast.info(`${action.label} action triggered`);
                      }}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined}
          table={table} // Pass the full table to ensure selection state is shared
        />

        {/* Table Footer for Pagination */}
        <TableFooter table={table} pageSizeOptions={pageSizeOptions} />

        {/* Floating selection controller for mobile */}
        {selectedRowCount > 0 && (
          <FloatingSelectionController
            selectedItems={selectedRowIds}
            allItemIds={allRowIds}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            batchActions={batchActions}
            currentAction={currentAction}
            isPending={isPending}
            onBatchAction={handleBatchAction}
            displayMode="compact"
            position="fixed"
          />
        )}
      </div>
    )
  }

  // Normal desktop table render
  return (
    <div className="space-y-4">
      <TableToolbar 
        table={table}
        searchColumnId={selectedSearchColumn}
        onSearchColumnChange={setSelectedSearchColumn}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder={searchPlaceholder}
        onAddItem={onAddItem}
        onDeleteRows={onDeleteRows}
        addButtonText={addButtonText}
        searchableColumns={defaultSearchableColumns}
        showColumnSelection={true} // Always show column selection on desktop
      />
      
      {/* Selection controller container - always render to maintain layout stability */}
      <div className={cn(
        "h-auto overflow-hidden transition-all duration-300",
        selectedRowCount > 0 ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"
      )}>
        <div className="p-1 rounded-md">
          <FloatingSelectionController
            selectedItems={selectedRowIds}
            allItemIds={allRowIds}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            batchActions={batchActions}
            currentAction={currentAction}
            isPending={isPending}
            onBatchAction={handleBatchAction}
            displayMode="full-width"
            position="static"
            className="transition-all duration-300"
          />
        </div>
      </div>
      
      <div className="bg-background overflow-hidden rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                    className={cn("h-12 px-3", header.column.columnDef.meta?.cellClassName)}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          header.column.getCanSort() &&
                          "flex h-full cursor-pointer items-center justify-start gap-2 select-none",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (header.column.getCanSort() && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            header.column.getToggleSortingHandler()?.(e)
                          }
                        }}
                        role={header.column.getCanSort() ? "button" : undefined}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                        aria-label={
                          header.column.getCanSort()
                            ? `Sort by ${header.column.columnDef.header?.toString()} (${
                                header.column.getIsSorted() === "desc"
                                  ? "descending"
                                  : header.column.getIsSorted() === "asc"
                                  ? "ascending"
                                  : "none"
                              })`
                            : undefined
                        }
                      >
                        <span>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center ml-auto">
                          {header.column.getIsSorted() === "asc" ? (
                            <ChevronUpIcon size={16} />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ChevronDownIcon size={16} />
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-row-${i}`}>
                  {columns.map((col) => (
                    <TableCell key={col.id || i}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => ( 
                <TableRow
                  key={row.id}
                className={cn("h-12 transition-colors", row.getIsSelected() && "bg-muted/50")}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "py-2 px-3", "[&>*:first-child]:flex [&>*:first-child]:items-center [&>*:first-child]:justify-start",
                        cell.column.columnDef.meta?.cellClassName,
                        cell.column.columnDef.meta?.showBorder && "border-x",
                      )}>
                    {
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                    }
                    </TableCell>
                  ))}

                </TableRow>
              ))
            ) : ( 
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )
              
            }
          </TableBody>
        </Table>
      </div>

      {/* Table Footer */}
     <TableFooter table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  )
}

// Default row actions component for convenience
export interface DefaultRowActionsProps<TData> {
  row: Row<TData>;
  onCopy?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  copyText?: string;
  editText?: string;
  deleteText?: string;
  showCopy?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}

export function DefaultRowActions<TData>({
  row,
  onCopy = (
    _data
  ) => {
    navigator.clipboard.writeText(JSON.stringify(_data, null, 2));
    toast.info("Row data copied to clipboard");
    // Clear selection after action
    if (row.getIsSelected()) {
      row.toggleSelected(false);
    }
  },
  onEdit = (
    _data
  ) => {
    toast.info("Edit row");
    console.log("Editing data:", _data);
    // Clear selection after action
    if (row.getIsSelected()) {
      row.toggleSelected(false);
    }
  },
  onDelete = (
    _data
  ) => {
    toast.info("Delete row");
    console.log("Deleting data:", _data);
    // Clear selection after action
    if (row.getIsSelected()) {
      row.toggleSelected(false);
    }
  },
  copyText = "Copy",
  editText = "Edit",
  deleteText = "Delete",
  showCopy = true,
  showEdit = true,
  showDelete = true,
}: DefaultRowActionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {showCopy && (
          <DropdownMenuItem
            onClick={() => onCopy(row.original)}
          >
            {copyText}
          </DropdownMenuItem>
        )}
        {showEdit && (
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            {editText}
          </DropdownMenuItem>
        )}
        {showCopy && showDelete && <DropdownMenuSeparator />}
        {showDelete && (
          <DropdownMenuItem onClick={() => onDelete(row.original)}>
            {deleteText}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
