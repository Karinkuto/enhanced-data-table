import type { Table } from "@tanstack/react-table";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import {
  MorphingDialog,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogTrigger,
  MorphingDialogClose,
} from "@/components/ui/morphing-dialog";
import { motion } from "motion/react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { cn } from "@/lib/utils";
import { getColumn, getColumnMeta, isFilterableColumn, type Column } from "@/lib/filters";
import { ActiveFilters, FitlerValueController } from "@/components/data-table-filter";

import { useIsMobile } from "@/hooks/useIsMobile";


interface TableFilterDialogProps<TData> {
  table: Table<TData>;
  property: string | undefined;
  setProperty: (property: string | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode; // for desktop trigger
}

function FilterableColumn<TData>({
  column,
  setProperty,
}: {
  column: Column<TData>;
  setProperty: (value: string) => void;
}) {
  const meta = column.columnDef.meta;
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
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const properties = table.getAllColumns().filter(isFilterableColumn);
  const hasFilters = table.getState().columnFilters.length > 0;
  const filtersCount = table.getState().columnFilters.length;

  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

  const clearFilters = useCallback(() => {
    table.setColumnFilters([]);
    table.setGlobalFilter("");
  }, [table]);

  return (
    <>
      <AnimatedGroup preset="fade" className="w-full">
        {property && column && columnMeta ? (
          <div key="specific-filter" className="px-4 py-2">
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
          </div>
        ) : (
          <div key="filter-selection" className="px-4 py-2">
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
          </div>
        )}
      </AnimatedGroup>
    </>
  );
}

export function TableFilterDialog<TData>({
  table,
  property,
  setProperty,
  open,
  onOpenChange,
  children,
}: TableFilterDialogProps<TData>) {
  const isMobile = useIsMobile(650);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = table.getState().columnFilters.length > 0;
  const properties = table.getAllColumns().filter(isFilterableColumn);

  const column = property ? getColumn(table, property) : undefined;
  const columnMeta = property ? getColumnMeta(table, property) : undefined;

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
    [property, column, columnMeta, value, table, properties, setProperty],
  );

  // Desktop Filter Dialog Content with delayed content transition
  const [showContent, setShowContent] = useState(true);
  const prevDialogKey = useRef<string | undefined>(undefined);
  const dialogKey =
    property && column && columnMeta ? "specific-filter" : "filter-selection";

  useEffect(() => {
    if (prevDialogKey.current && prevDialogKey.current !== dialogKey) {
      setShowContent(false);
      const timeout = setTimeout(() => {
        setShowContent(true);
      }, 350); // match MorphingDialog spring duration
      return () => clearTimeout(timeout);
    }
    prevDialogKey.current = dialogKey;
  }, [dialogKey]);

  const FilterDialogContent = useMemo(() => {
    if (!showContent) {
      // Render a placeholder to allow the dialog to morph first
      return <div style={{ minHeight: 120 }} />;
    }
    return (
      <AnimatedGroup preset="fade" className="w-full">
        {property && column && columnMeta ? (
          <div key="specific-filter">
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
          </div>
        ) : (
          <div key="filter-selection">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-base font-medium">Filter data</span>
              <MorphingDialogClose className="h-8 w-8 rounded-full hover:bg-muted/80 flex items-center justify-center top-3 right-3">
                <X className="h-4 w-4" />
              </MorphingDialogClose>
            </div>
            <div
              className={cn(
                "p-4",
                hasFilters
                  ? "flex flex-col md:flex-row gap-4"
                  : "flex flex-col gap-4",
              )}
            >
              {hasFilters && (
                <div className="flex flex-col max-w-lg h-full justify-between">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Active filters</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                        <ActiveFilters table={table} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm h-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={clearFilters}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Clear all
                    </Button>
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "flex-1",
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
              </div>
            </div>
          </div>
        )}
      </AnimatedGroup>
    );
  }, [
    showContent,
    property,
    column,
    columnMeta,
    filterContent,
    hasFilters,
    clearFilters,
    table,
    setProperty,
  ]);


  // Render
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <MobileFilterContent
            table={table}
            property={property}
            setProperty={setProperty}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop
  return (
    <MorphingDialog transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <MorphingDialogTrigger>
        {children ?? <span />}
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
          <motion.div layout>
            {FilterDialogContent}
          </motion.div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
