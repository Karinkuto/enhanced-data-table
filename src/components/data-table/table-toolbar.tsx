import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListFilterIcon, PlusIcon, ArrowRight, Filter, X, Loader } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { SearchCommand } from "./search-command";
import type { SearchableColumn } from "./data-table";
import { 
  ActiveFilters, 
  FilterActions, 
  FitlerValueController 
} from "@/components/data-table-filter";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  getColumn, 
  getColumnMeta, 
  isFilterableColumn
} from "@/lib/filters";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// Local implementation of useIsMobile with 650px breakpoint
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 650); // Mobile breakpoint at 650px
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

// Check if code is running in browser
const isBrowser = typeof window !== 'undefined';

interface TableToolbarProps<TData> {
  table: Table<TData>;
  searchColumnId?: string;
  onSearchColumnChange?: (column: string) => void;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  onAddItem?: () => void;
  onDeleteRows?: (rows: TData[]) => void;
  addButtonText?: string;
  searchableColumns?: SearchableColumn[];
  showColumnSelection?: boolean;
}

// Custom FilterableColumn component for use in the toolbar
function FilterableColumn<TData>({
  column,
  setProperty,
}: {
  column: Column<TData>
  setProperty: (value: string) => void
}) {
  const meta = column.columnDef.meta;
  // Safety check
  if (!meta?.icon) {
    return null;
  }
  const Icon = meta.icon;
  
  return (
    <CommandItem onSelect={() => setProperty(column.id)} className="group">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          {<Icon strokeWidth={2.25} className="size-4" />}
          <span>{meta?.displayName || column.id}</span>
        </div>
        <ArrowRight className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  )
}

// Mobile Filter Content
function MobileFilterContent<TData>({
  table,
  property,
  setProperty,
  onClose,
}: {
  table: Table<TData>;
  property: string | undefined;
  setProperty: (property: string | undefined) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const properties = table.getAllColumns().filter(isFilterableColumn);
  const hasFilters = table.getState().columnFilters.length > 0;
  const filtersCount = table.getState().columnFilters.length;
  
  // Create filter selection or value UI based on state
  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

  // Function to clear all filters
  const clearFilters = () => {
    table.setColumnFilters([]);
    table.setGlobalFilter('');
  };

  return (
    <>
      {property && column && columnMeta ? (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8" 
              onClick={() => setProperty(undefined)}
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5 rotate-180" />
              Back
            </Button>
            <span className="text-sm font-medium">
              Filter by {columnMeta.displayName || column.id}
            </span>
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="size-8"
              >
                <X className="size-3.5" />
              </Button>
            </DrawerClose>
          </div>
          <FitlerValueController
            id={property}
            column={column}
            columnMeta={columnMeta}
            table={table}
          />
        </div>
      ) : (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              <DrawerTitle className="text-base">
                {hasFilters 
                  ? `${filtersCount} active ${filtersCount === 1 ? "filter" : "filters"}` 
                  : "Filter data"
                }
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="size-8"
              >
                <X className="size-3.5" />
              </Button>
            </DrawerClose>
          </div>
          
          {hasFilters && (
            <div className="mb-4 border-b pb-4">
              <div className="text-sm font-medium mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-1.5">
                <ActiveFilters table={table} />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 w-full h-9 gap-1.5"
                onClick={clearFilters}
              >
                <X className="size-3.5" />
                Clear all filters
              </Button>
            </div>
          )}
          
          <div className="mb-2 text-sm font-medium">Filter by column:</div>
          <Command loop className="rounded-lg border">
            <CommandInput
              value={value}
              onValueChange={setValue}
              ref={inputRef}
              placeholder="Search columns..."
              className="h-9"
            />
            <CommandEmpty>No filterable columns found.</CommandEmpty>
            <CommandList className="max-h-[60vh]">
              <CommandGroup>
                {properties.map((column) => (
                  <FilterableColumn
                    key={column.id}
                    column={column}
                    setProperty={setProperty}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </>
  );
}

export function TableToolbar<TData>({
  table,
  searchColumnId = "all",
  onSearchColumnChange,
  searchValue = "",
  onSearchValueChange,
  searchPlaceholder = "Search...",
  onAddItem,
  addButtonText = "Add item",
  searchableColumns = [],
  showColumnSelection = true,
}: TableToolbarProps<TData>) {
  const isMobile = useIsMobile();
  const [filterOpen, setFilterOpen] = useState(false);
  const [property, setProperty] = useState<string | undefined>(undefined);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hasFilters = table.getState().columnFilters.length > 0;
  const properties = table.getAllColumns().filter(isFilterableColumn);

  // Reset input value when popover closes
  useEffect(() => {
    if (!filterOpen) setTimeout(() => setValue(''), 150);
  }, [filterOpen]);

  // Focus input when property is selected
  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus();
      setValue('');
    }
  }, [property]);

  // Reset property when drawer/popover closes
  useEffect(() => {
    if (!filterOpen) {
      setTimeout(() => setProperty(undefined), 300);
    }
  }, [filterOpen]);

  // Create filter selection or value UI based on state
  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

  // Function to clear all filters
  const clearFilters = () => {
    table.setColumnFilters([]);
    table.setGlobalFilter('');
  };

  const filterContent = useMemo(
    () =>
      property && column && columnMeta ? (
        <FitlerValueController
          id={property}
          column={column}
          columnMeta={columnMeta}
          table={table}
        />
      ) : (
        <Command loop>
          <CommandInput
            value={value}
            onValueChange={setValue}
            ref={inputRef}
            placeholder="Search columns..."
          />
          <CommandEmpty>No filterable columns found.</CommandEmpty>
          <CommandList className="max-h-[300px]">
            <CommandGroup>
              {properties.map((column) => (
                <FilterableColumn
                  key={column.id}
                  column={column}
                  setProperty={setProperty}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      ),
    [property, column, columnMeta, value, table, properties],
  );

  const handleOpenChange = (open: boolean) => {
    setFilterOpen(open);
    if (!open) {
      // Small delay to avoid flickering
      setTimeout(() => setProperty(undefined), 300);
    }
  };

  return (
    <Card className="mb-2 p-1">
      <CardContent className="p-1">
        <div className={cn("flex flex-col gap-3", isMobile ? "" : "flex-row items-center")}>
          {/* Search with command */}
          <div className={cn("flex-1", isMobile ? "w-full" : "")}>
            {searchableColumns.length > 0 && (
              <SearchCommand
                columns={searchableColumns}
                selectedColumn={searchColumnId}
                onColumnChange={onSearchColumnChange ?? (() => {})}
                searchValue={searchValue}
                onSearchChange={onSearchValueChange ?? (() => {})}
                placeholder={searchPlaceholder}
                showColumnSelection={showColumnSelection}
              />
            )}
          </div>

          <div className={cn("flex items-center", isMobile ? "flex-wrap justify-between w-full gap-2" : "gap-3 ml-auto")}>
            {/* Add button */}
            {onAddItem && (
              <Button
                variant="outline"
                onClick={() => {
                  onAddItem();
                }}
                className="flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                {addButtonText}
              </Button>
            )}

            <div className={cn(
              "flex items-center flex-wrap", 
              isMobile ? "gap-1 ml-auto" : "gap-2"
            )}>
              {/* Filter section */}
              <div className="flex items-center gap-2">
                {/* Filter button triggers filter UI */}
                {isMobile ? (
                  <Drawer open={filterOpen} onOpenChange={handleOpenChange}>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1 h-9",
                          hasFilters && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Filter className="h-4 w-4" aria-hidden="true" />
                        {hasFilters && (
                          <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs w-4 h-4 flex items-center justify-center">
                            {table.getState().columnFilters.length}
                          </span>
                        )}
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <MobileFilterContent
                        table={table}
                        property={property}
                        setProperty={setProperty}
                        onClose={() => setFilterOpen(false)}
                      />
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <>
                    <Popover
                      open={filterOpen}
                      onOpenChange={handleOpenChange}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1.5 h-9 font-medium",
                            hasFilters && "bg-accent text-accent-foreground"
                          )}
                        >
                          <Filter className="h-4 w-4" aria-hidden="true" />
                          Filter
                          {hasFilters && (
                            <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                              {table.getState().columnFilters.length}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="bottom"
                        className="w-[260px] p-0"
                      >
                        {property && column ? (
                          <>
                            <div className="flex items-center justify-between border-b p-2 mb-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7 px-2" 
                                onClick={() => setProperty(undefined)}
                              >
                                <ArrowRight className="h-3.5 w-3.5 mr-1 rotate-180" />
                                Back
                              </Button>
                              <span className="text-sm font-medium">{columnMeta?.displayName || column.id}</span>
                              <div className="w-7" /> {/* Spacer for alignment */}
                            </div>
                            <div className="p-1">
                              {filterContent}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between border-b p-2 mb-1">
                              <span className="text-sm font-medium">Filter by column</span>
                              {hasFilters && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" 
                                  onClick={clearFilters}
                                >
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  Clear
                                </Button>
                              )}
                            </div>
                            <div className="p-1">
                              {hasFilters && (
                                <div className="mb-2 p-1 border-b pb-2">
                                  <span className="text-xs font-medium text-muted-foreground mb-1 block">Active filters:</span>
                                  <div className="flex flex-wrap gap-1">
                                    <ActiveFilters table={table} />
                                  </div>
                                </div>
                              )}
                              {filterContent}
                            </div>
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                  </>
                )}
              </div>

              {/* Columns button - Hide in mobile view */}
              {!isMobile && (
                <Button
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 font-medium"
                  onClick={() => toast.info("Column management coming soon")}
                >
                  <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                    <div className="bg-current rounded-sm" />
                  </div>
                  Columns
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
