import React from "react"
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
import { ChevronDownIcon, ChevronUpIcon, MoreVertical } from "lucide-react"
import { useId, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { MobileDataView } from "@/components/data-table/mobile-data-view"
import { toast } from "sonner"

// Custom filter function for multi-column searching
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [selectedSearchColumn, setSelectedSearchColumn] = useState<string>(searchColumnId || "all")
  const [searchValue, setSearchValue] = useState<string>("")

  const [sorting, setSorting] = useState<SortingState>(
    initialSorting || [
      {
        id: columns[0]?.id || (columns[0]?.accessorKey as string) || "",
        desc: false,
      },
    ],
  )

  // When search column or value changes, update the column filters
  React.useEffect(() => {
    if (selectedSearchColumn && searchValue) {
      setColumnFilters([{
        id: selectedSearchColumn,
        value: searchValue
      }])
    } else {
      setColumnFilters([])
    }
  }, [selectedSearchColumn, searchValue])

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

  // Render functions for mobile view
  const renderHeader = (row: Row<TData>) => {
    // Find the name column or use the first visible column
    const nameColumn = columns.find(
      (col) =>
        (col.accessorKey === "name" || col.id === "name") &&
        table.getColumn((col.accessorKey as string) || col.id)?.getIsVisible(),
    )

    if (nameColumn) {
      return flexRender(nameColumn.cell, {
        ...row
          .getVisibleCells()
          .find((cell) => cell.column.id === ((nameColumn.accessorKey as string) || nameColumn.id))
          ?.getContext(),
        row,
      })
    } else {
      // Fallback to first column
      const firstVisibleCell = row
        .getVisibleCells()
        .find((cell) => cell.column.id !== "select" && cell.column.id !== "actions")

      if (firstVisibleCell) {
        return flexRender(firstVisibleCell.column.columnDef.cell, firstVisibleCell.getContext())
      }

      return null
    }
  }

  const renderSubheader = (row: Row<TData>) => {
    // Find email and location columns
    const emailColumn = columns.find((col) => col.accessorKey === "email" || col.id === "email")

    const locationColumn = columns.find((col) => col.accessorKey === "location" || col.id === "location")

    const emailCell = row
      .getVisibleCells()
      .find((cell) => cell.column.id === ((emailColumn?.accessorKey as string) || emailColumn?.id))

    const locationCell = row
      .getVisibleCells()
      .find((cell) => cell.column.id === ((locationColumn?.accessorKey as string) || locationColumn?.id))

    return (
      <div className="flex items-center gap-1">
        {emailCell && <span>{row.getValue(emailCell.column.id)}</span>}
        {emailCell && locationCell && <span className="mx-1">•</span>}
        {locationCell && <span>{row.getValue(locationCell.column.id)}</span>}
      </div>
    )
  }

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
        // Special styling for status badges
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

  // Generate default searchable columns if not provided
  const defaultSearchableColumns = React.useMemo(() => {
    if (searchableColumns && searchableColumns.length > 0) return searchableColumns;
    
    return columns
      .filter(column => 
        column.id !== "select" && 
        column.id !== "actions" && 
        typeof column.accessorKey === "string"
      )
      .map(column => ({
        id: column.accessorKey as string || column.id,
        label: typeof column.header === "string" 
          ? column.header 
          : column.accessorKey as string || column.id
      }));
  }, [columns, searchableColumns]);

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
                        className="h-11"
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
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
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
                    data-state={row.getIsSelected() ? "selected" : ""}
                    className={cn(
                      "h-12 transition-all duration-200 ease-in-out", 
                      row.getIsSelected() && "bg-muted/50"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "py-2 [&:has([role=checkbox])]:flex [&:has([role=checkbox])]:items-center [&:has([role=checkbox])]:justify-center",
                          cell.column.id === "actions" && "w-10 p-0"
                        )}
                      >
                        {cell.column.id === "actions" && rowActions ? (
                          <div className="flex h-full items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuGroup>
                                  {rowActions.map((action, index) => (
                                    <DropdownMenuItem
                                      key={index}
                                      onClick={() => {
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
                          </div>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
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
              )}
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

