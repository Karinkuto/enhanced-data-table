import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CircleAlertIcon, ListFilterIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { SearchCommand } from "./search-command";
import type { SearchableColumn } from "./data-table";

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
}

export function TableToolbar<TData>({
  table,
  searchColumnId = "all",
  onSearchColumnChange,
  searchValue = "",
  onSearchValueChange,
  searchPlaceholder = "Search...",
  onAddItem,
  onDeleteRows,
  addButtonText = "Add item",
  searchableColumns = [],
}: TableToolbarProps<TData>) {
  const isMobile = useMobile();
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedRowsCount = selectedRows.length;

  const handleDeleteRows = () => {
    if (!onDeleteRows) return;
    const originals = selectedRows.map((row) => row.original);
    onDeleteRows(originals);
    table.resetRowSelection();
    toast.success(
      `Deleted ${originals.length} ${originals.length === 1 ? "row" : "rows"}`
    );
  };

  return (
    <Card className="mb-2 p-1">
      <CardContent className="p-1">
        <div className={cn("flex gap-3", isMobile ? "flex-col" : "flex-row items-center")}>
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
              />
            )}
          </div>

          <div className={cn("flex items-center gap-3", isMobile ? "justify-between w-full" : "")}>
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

            <div className="flex items-center gap-2">
              {/* Filter button (UI only for now) */}
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => toast.info("Filter feature coming soon")}
              >
                <ListFilterIcon className="h-4 w-4" aria-hidden="true" />
                Filter
              </Button>

              {/* Columns button (UI only for now) */}
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
            </div>

            {/* Delete button, visible when rows are selected */}
            {onDeleteRows && selectedRowsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="ml-auto flex items-center" variant="outline">
                    <TrashIcon className="h-4 w-4 mr-1 opacity-60" aria-hidden="true" />
                    Delete
                    <span className="bg-background text-muted-foreground/70 -mr-1 ml-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
                      {selectedRowsCount}
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border"
                      aria-hidden="true"
                    >
                      <CircleAlertIcon className="opacity-80" size={16} />
                    </div>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete{" "}
                        {selectedRowsCount} selected {selectedRowsCount === 1 ? "row" : "rows"}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
