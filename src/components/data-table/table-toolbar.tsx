import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlusIcon, ArrowRight, Filter, X } from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { SearchCommand } from "./search-command";
import type { SearchableColumn } from "./data-table";
import {
  ActiveFilters,
  FitlerValueController,
} from "@/components/data-table-filter";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  MorphingDialog,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogTrigger,
  MorphingDialogClose,
} from "@/components/ui/morphing-dialog";
import {
  getColumn,
  getColumnMeta,
  isFilterableColumn,
  type Column,
} from "@/lib/filters";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { motion } from "motion/react";

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
    window.addEventListener("resize", checkIsMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

// Define content transition variants
const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

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
  column: Column<TData>;
  setProperty: (value: string) => void;
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
  );
}

// Mobile Filter Content
function MobileFilterContent<TData>({
  table,
  property,
  setProperty,
}: {
  table: Table<TData>;
  property: string | undefined;
  setProperty: (property: string | undefined) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const properties = table.getAllColumns().filter(isFilterableColumn);
  const hasFilters = table.getState().columnFilters.length > 0;
  const filtersCount = table.getState().columnFilters.length;

  // Create filter selection or value UI based on state
  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    table.setColumnFilters([]);
    table.setGlobalFilter("");
  }, [table]);

  return (
    <>
      {property && column && columnMeta ? (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
          className="px-4 py-2"
        >
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
              <Button variant="outline" size="icon" className="size-8">
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
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
          className="px-4 py-2"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              <DrawerTitle className="text-base">Filter data</DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="outline" size="icon" className="size-8">
                <X className="size-3.5" />
              </Button>
            </DrawerClose>
          </div>

          {hasFilters && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Active filters ({filtersCount})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={clearFilters}
                >
                  <X className="size-3.5 mr-1.5" />
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                <ActiveFilters table={table} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm font-medium">
              Select a column to filter
            </span>
            <Command loop className="rounded-lg border mt-2">
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
        </motion.div>
      )}
    </>
  );
}

// Create a better type definition for DialogContent
// type ExtendedDialogContentProps = React.ComponentProps<typeof DialogContent> & {
//   hideCloseButton?: boolean;
// };

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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [property, setProperty] = useState<string | undefined>(undefined);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = table.getState().columnFilters.length > 0;
  const properties = table.getAllColumns().filter(isFilterableColumn);

  // Focus input when property is selected
  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus();
      setValue("");
    }
  }, [property]);

  // Reset property when mobile drawer closes
  useEffect(() => {
    if (!mobileFilterOpen) {
      setTimeout(() => setProperty(undefined), 300);
    }
  }, [mobileFilterOpen]);

  // Create filter selection or value UI based on state
  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    table.setColumnFilters([]);
    table.setGlobalFilter("");
  }, [table]);

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

  // Desktop Filter Dialog Content
  const FilterDialogContent = useMemo(
    () =>
      property && column && columnMeta ? (
        // When showing a specific filter's content (normal width)
        <motion.div
          key="specific-filter"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
          layoutId="filter-content"
        >
          <div className="flex items-center justify-between border-b p-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={() => setProperty(undefined)}
            >
              <ArrowRight className="h-3.5 w-3.5 mr-1.5 rotate-180" />
              Back
            </Button>
            <span className="text-base font-medium">
              {columnMeta?.displayName || column.id}
            </span>
            <MorphingDialogClose className="h-8 w-8 rounded-full hover:bg-muted/80 flex items-center justify-center top-3 right-3">
              <X className="h-4 w-4" />
            </MorphingDialogClose>
          </div>
          <div className="p-3">{filterContent}</div>
        </motion.div>
      ) : (
        // Main filter selection view (can be wider for two columns)
        <motion.div
          key="filter-selection"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={contentVariants}
          layoutId="filter-content"
        >
          <div className="flex items-center justify-between border-b p-3">
            <span className="text-base font-medium">Filter data</span>
            <MorphingDialogClose className="h-8 w-8 rounded-full hover:bg-muted/80 flex items-center justify-center top-3 right-3">
              <X className="h-4 w-4" />
            </MorphingDialogClose>
          </div>
          <div
            className={cn(
              "p-4",
              // Use column layout only if we have active filters, otherwise single column
              hasFilters
                ? "flex flex-col md:flex-row gap-4"
                : "flex flex-col gap-4",
            )}
          >
            {/* Left column - Active filters - only show if we have filters */}
            {hasFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="md:w-[240px] flex flex-col"
              >
                <div>
                  <h3 className="text-sm font-medium mb-2">Active filters</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                      <ActiveFilters table={table} />
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 text-sm h-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={clearFilters}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear all
                </Button>
              </motion.div>
            )}

            {/* Right column - Filter selection */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "flex-1",
                // Add border and padding only if we're in two-column mode
                hasFilters &&
                  "border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4",
              )}
            >
              <div className="space-y-3">
                <h3 className="text-sm font-medium">
                  Select a column to filter
                </h3>
                {filterContent}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ),
    [
      property,
      column,
      columnMeta,
      filterContent,
      hasFilters,
      clearFilters,
      table,
    ],
  );

  return (
    <Card className="mb-2 p-1">
      <CardContent className="p-1">
        <div
          className={cn(
            "flex flex-col gap-3",
            isMobile ? "" : "flex-row items-center",
          )}
        >
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

          <div
            className={cn(
              "flex items-center",
              isMobile
                ? "flex-wrap justify-between w-full gap-2"
                : "gap-3 ml-auto",
            )}
          >
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

            <div
              className={cn(
                "flex items-center flex-wrap",
                isMobile ? "gap-1 ml-auto" : "gap-2",
              )}
            >
              {/* Filter section */}
              <div className="flex items-center gap-2">
                {/* Filter button triggers filter UI */}
                {isMobile ? (
                  <Drawer
                    open={mobileFilterOpen}
                    onOpenChange={setMobileFilterOpen}
                  >
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex items-center gap-1 h-9",
                          hasFilters && "bg-accent text-accent-foreground",
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
                        onClose={() => setMobileFilterOpen(false)}
                      />
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <>
                    <MorphingDialog
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <MorphingDialogTrigger
                        className={cn(
                          "flex items-center gap-1.5 h-9 font-medium bg-background border shadow-sm px-3 rounded-md",
                          hasFilters && "bg-accent text-accent-foreground",
                        )}
                      >
                        <Filter className="h-4 w-4" aria-hidden="true" />
                        <span>Filter</span>
                        {hasFilters && (
                          <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                            {table.getState().columnFilters.length}
                          </Badge>
                        )}
                      </MorphingDialogTrigger>

                      <MorphingDialogContainer>
                        <MorphingDialogContent
                          className={cn(
                            "bg-background border shadow-lg rounded-lg overflow-hidden z-50",
                            property
                              ? "w-auto min-w-[350px] max-w-7xl"
                              : hasFilters
                                ? "w-auto min-w-[750px] max-w-7xl"
                                : "w-auto min-w-[350px] max-w-md",
                          )}
                        >
                          {FilterDialogContent}
                        </MorphingDialogContent>
                      </MorphingDialogContainer>
                    </MorphingDialog>
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
