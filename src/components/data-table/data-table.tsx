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
  flexRender, RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable, Header,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon, MoreVertical } from "lucide-react"
import { useId, useState } from "react"
import {
  DropdownMenu,  
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,

  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { MobileDataView, } from "@/components/data-table/mobile-data-view"
import { toast } from "sonner"
import React, { useMemo } from "react"

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
}: DataTableProps<TData>) {

  const id = useId()
  const isMobile = useMobile()
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

  // Render functions for mobile views
  const renderHeader = (row: Row<TData>) => {
    let cell: any;
    const nameColumn = columns.find((col) => col.id === "name" && table.getColumn(col.id)?.getIsVisible());
  
    if (nameColumn) {
      cell = row.getVisibleCells().find((c) => c.column.id === nameColumn.id);
    } else {
      const firstVisibleCell = row.getVisibleCells().find((c) => c.column.id !== "select" && c.column.id !== "actions");
      cell = firstVisibleCell;
    }
  
    return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()): null
  };

  const renderSubheader = (row: Row<TData>) => {
    const visibleCells = row.getVisibleCells()
    const emailCell = visibleCells.find((cell) => cell.column.id === "email")
    const locationCell = visibleCells.find((cell) => cell.column.id === "location")

    let emailSpan = null;
    if (emailCell) {
      emailSpan = <span key="email">{String(emailCell.getValue())}</span>;
    }

    let separatorSpan = null;
    let locationSpan = null;
    if (locationCell) {
      separatorSpan = <span key="separator" className="mx-1"> • </span>;
      locationSpan = <span key="location">{String(locationCell.getValue())}</span>;
    }

    return (
      <div className="flex items-center gap-1">
        {emailSpan}
        {locationSpan ? separatorSpan : null}
        {locationSpan}
      </div>
    );
  };


  
  

  const renderDetailRows = (row: Row<TData>) => {

    return row
      .getVisibleCells()
      .filter(
        (cell) =>
          cell.column.id !== "select" &&
          cell.column.id !== "actions" &&
          cell.column.id !== "name" &&
          cell.column.id !== "email",
      )
      .map((cell) => {
      
        const isStatus = cell.column.id === "status"

        return (
          <React.Fragment key={cell.column.id}>
            <TableCell className="bg-muted/20 py-3 font-medium w-1/3 border-r border-border">
              {typeof cell.column.columnDef.header === "string"
                ? cell.column.columnDef.header
                : cell.column.id.charAt(0).toUpperCase() + cell.column.id.slice(1)}
            </TableCell>
            <TableCell className="py-3 w-2/3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
          </React.Fragment>
        )
      })
  }

  
  const defaultSearchableColumns = useMemo(() => {
    if (searchableColumns?.length) {
      return searchableColumns
    } else {  
        return columns.reduce((cols: SearchableColumn[], col) => {
          if (col.id && col.id !== "select" && col.id !== "actions") {


              cols.push({
                  id: col.id,
                  
                  label: (typeof col.header === "string" ? col.header : col.id)

              })
        }
        return cols
      }, [])
    }
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

    
  return (
    <div className="space-y-4">
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
      />

      {isMobile ? (
        /* Mobile View */
        <MobileDataView
          data={table.getRowModel().rows}
          renderHeader={renderHeader}
          renderSubheader={renderSubheader}
          renderDetailRows={renderDetailRows}
          onRowAction={rowActions ? (row) => {} : undefined}
          rowActions={rowActions ? (row) => (
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
                  {rowActions.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
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
export function DefaultRowActions<TData>({ row }: { row: Row<TData> }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(row.original, null, 2))
            toast.info("Row data copied to clipboard")
          }}
        >
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info("Edit row")}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toast.info("Delete row")}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

}
