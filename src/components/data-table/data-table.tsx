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
  flexRender, type RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, MoreVertical } from "lucide-react"
import { useId, useState, useEffect } from "react"
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
import { Copy, Edit, Trash } from "lucide-react"

// Custom filter function for multi-column searching
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    cellClassName?: string;
    showBorder?: boolean;
  }
}

const defaultActionColumn: ColumnDef<any> = {
  id: "actions"
}

export const multiColumnFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  if (!filterValue) return true
  
  // If searching all columns
  if (columnId === "all") {
    const searchableRowContent = Object.values(row.original)
      .filter((val) => typeof val === "string")
      .join(" ") 
      .toLowerCase()
    const searchTerm = (filterValue ?? "").toLowerCase()
    return searchableRowContent.includes(searchTerm)
  }

  // If searching a specific column 
  const value = row.getValue(columnId) as string
  if (typeof value === "string") {
    return value.toLowerCase().includes((filterValue ?? "").toLowerCase())
  }
  
  return false
}

// Filter function for status or any categorical field
export const categoryFilterFn: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  if (!filterValue?.length) return true
  const value = row.getValue(columnId) as string
  return filterValue.includes(value)
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
}

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
  // Table toolbar customization
  tableToolbarProps?: {
    onFilter?: () => void;
    onManageColumns?: () => void;
    filterText?: string;
    columnsText?: string;
    showFilterButton?: boolean;
    showColumnsButton?: boolean;
  }
}

// Create a type for the cell to avoid 'any' type
type DataTableCell<TData> = ReturnType<Row<TData>['getVisibleCells']>[number];

// Simple isMobile hook implementation
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // Standard mobile breakpoint
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
}

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
  tableToolbarProps,
}: DataTableProps<TData>) {

  const id = useId()
  const isMobile = useIsMobile()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const defaultSorting = initialSorting ?? (columns.length > 0 && columns[0].id ? [{
    id: columns[0].id,
    desc: false,
  }]

   : []);
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  
  const table = useReactTable({
    data, 
    columns, 
    
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
      multiColumn: multiColumnFilterFn,
      
      category: categoryFilterFn, 
    },
    state: { 
      sorting,
      pagination, 
      columnFilters,
      columnVisibility,
    },

  })

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
            <TableCell className="bg-muted/20 py-3 font-medium w-1/3 min-w-[100px] max-w-[120px] border-r border-border whitespace-normal break-words">
              {columnLabel}
            </TableCell>
            <TableCell className="py-3 w-2/3 overflow-hidden break-words">
              {String(cell.getValue())}
            </TableCell>
          </React.Fragment>
        );
      });
  };

  const defaultSearchableColumns = useMemo(() => {
    if (searchableColumns?.length) {
      return searchableColumns
    }
        return columns.reduce((cols: SearchableColumn[], col) => {
          if (col.id && col.id !== "select" && col.id !== "actions") {


              cols.push({
                  id: col.id,
                  
                  label: (typeof col.header === "string" ? col.header : col.id)

              })
        }
        return cols
      }, [])
  }, [searchableColumns, columns])
  const [selectedSearchColumn, setSelectedSearchColumn] = useState<string>(searchColumnId || "all")
  const [searchValue, setSearchValue] = useState<string>("")

   // When search column or value changes, update the column filters
  React.useEffect(() => {
    if (selectedSearchColumn && searchValue) {
      table.setColumnFilters([{
        id: selectedSearchColumn,
        value: searchValue
      }])
    } else {
      table.setColumnFilters([])
    }
  }, [selectedSearchColumn, searchValue, table])

  // Create batch actions for mobile view with default values if not provided
  const defaultBatchActions = [
    {
      label: "Copy",
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: (selectedIds: string[]) => {
        const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
        navigator.clipboard.writeText(JSON.stringify(selectedRows, null, 2));
        toast.info("Selected rows copied to clipboard");
      },
    },
    {
      label: "Edit",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: () => {
        toast.info("Edit selected rows");
      },
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
    },
  ];

  // Map custom batch actions
  const batchActions = mobileBatchActions 
    ? mobileBatchActions.map(action => ({
        label: action.label,
        icon: action.icon,
        onClick: (selectedIds: string[]) => {
          const selectedRows = table.getSelectedRowModel().rows
            .filter(row => selectedIds.includes(row.id))
            .map(row => row.original);
          return action.onClick(selectedRows);
        },
      }))
    : defaultBatchActions;

  return (
    <div className="flex flex-col w-full h-[95dvh] justify-between ">
      {/* CSS utility for no-scrollbar */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Table Toolbar */}
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
        {...tableToolbarProps}
      />

      {isMobile ? (
        /* Mobile View */
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
        />
      ) : (
        /* Desktop View */
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
                      className={cn("h-12", header.column.columnDef.meta?.cellClassName)}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className={cn(
                            header.column.getCanSort() &&
                            "flex h-full cursor-pointer items-center justify-between gap-2 select-none",
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
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center">
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => ( 
                  <TableRow
                    key={row.id}
                  className={cn("h-12 transition-colors", row.getIsSelected() && "bg-muted/50")}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "py-2", "[&>*:first-child]:flex [&>*:first-child]:items-center [&>*:first-child]:justify-center",
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
      )}

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
  onCopy = (row) => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2));
    toast.info("Row data copied to clipboard");
  },
  onEdit = (row) => toast.info("Edit row"),
  onDelete = (row) => toast.info("Delete row"),
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
