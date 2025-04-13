import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlusIcon, Filter } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SearchCommand } from "./search-command";
import type { SearchableColumn } from "./data-table";
import { TableFilterDialog } from "./table-filter-dialog";
import { Badge } from "@/components/ui/badge";
import { ColumnVisibilityPopover } from "./column-visibility-popover";

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


// (Removed: MobileFilterContent and related filter dialog logic)

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
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = table.getState().columnFilters.length > 0;

  // Focus input when property is selected
  useEffect(() => {
    if (property && inputRef) {
      inputRef.current?.focus();
    }
  }, [property]);

  // Reset property when mobile drawer closes
  useEffect(() => {
    if (!mobileFilterOpen) {
      setTimeout(() => setProperty(undefined), 300);
    }
  }, [mobileFilterOpen]);

  // (Removed: filterContent, FilterDialogContent, and related filter dialog logic)

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
                  <>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1.5 h-9 font-medium bg-background border shadow-sm px-3 rounded-md",
                        hasFilters && "bg-accent text-accent-foreground",
                      )}
                      onClick={() => setMobileFilterOpen(true)}
                    >
                      <Filter className="h-4 w-4" aria-hidden="true" />
                      <span>Filter</span>
                      {hasFilters && (
                        <Badge className="ml-1 bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center">
                          {table.getState().columnFilters.length}
                        </Badge>
                      )}
                    </Button>
                    <TableFilterDialog
                      table={table}
                      property={property}
                      setProperty={setProperty}
                      open={mobileFilterOpen}
                      onOpenChange={setMobileFilterOpen}
                    />
                  </>
                ) : (
                  <TableFilterDialog
                    table={table}
                    property={property}
                    setProperty={setProperty}
                    open={false} // not used for desktop
                    onOpenChange={() => {}} // not used for desktop
                  >
                    <Button
                      variant="outline"
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
                    </Button>
                  </TableFilterDialog>
                )}
              </div>

              {/* Columns button - Hide in mobile view */}
              {!isMobile && (
                <ColumnVisibilityPopover table={table} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
