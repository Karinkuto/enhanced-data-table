import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListFilterIcon, PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SearchCommand } from "./search-command";
import type { SearchableColumn } from "./data-table";

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

export function TableToolbar<TData>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              "flex items-center", 
              isMobile ? "gap-1 ml-auto" : "gap-2"
            )}>
              {/* Filter button (UI only for now) */}
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => toast.info("Filter feature coming soon")}
              >
                <ListFilterIcon className="h-4 w-4" aria-hidden="true" />
                {!isMobile ? "Filter" : ""}
              </Button>

              {/* Columns button (UI only for now) - Hide in mobile view */}
              {!isMobile && (
                <Button
                  variant="outline"
                  className="flex items-center gap-1"
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
