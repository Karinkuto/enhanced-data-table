import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { Columns as ColumnsIcon } from "lucide-react";

interface ColumnVisibilityPopoverProps<TData> {
  table: Table<TData>;
}

import { useMemo, useCallback } from "react";

export function ColumnVisibilityPopover<TData>({ table }: ColumnVisibilityPopoverProps<TData>) {
  const [open, setOpen] = useState(false);
  const columns = table.getAllLeafColumns();

  // Optionally, filter out columns that should never be hidden (e.g., id, selection)
  // For now, allow toggling all columns except those with 'enableHiding' === false
  const toggleableColumns = useMemo(
    () =>
      columns.filter(
        (col) => (col.columnDef.enableHiding ?? true) && col.getCanHide?.() !== false
      ),
    [columns]
  );

  const handleShowAll = useCallback(() => {
    toggleableColumns.forEach((col) => {
      if (!col.getIsVisible()) col.toggleVisibility(true);
    });
  }, [toggleableColumns]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-1.5 h-9 font-medium bg-background border shadow-sm px-3 rounded-md"
          aria-label="Show/hide columns"
        >
          <ColumnsIcon className="w-4 h-4" aria-hidden="true" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-64"
        align="end"
        sideOffset={8}
        collisionPadding={8}
      >
        <Command>
          {toggleableColumns.some((col) => !col.getIsVisible()) && (
            <div className="p-2 border-b flex">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleShowAll}
                className="flex-1"
              >
                Show all
              </Button>
            </div>
          )}
          <CommandInput placeholder="Search columns..." />
          <CommandList>
            {toggleableColumns.map((column) => (
              <CommandItem
                key={column.id}
                onSelect={() => column.toggleVisibility()}
                className="flex items-center gap-2"
              >
                <Checkbox
                  checked={column.getIsVisible()}
                  onCheckedChange={() => column.toggleVisibility()}
                  id={`column-toggle-${column.id}`}
                />
                <label
                  htmlFor={`column-toggle-${column.id}`}
                  className="ml-2 cursor-pointer select-none"
                >
                  {typeof column.columnDef.header === "function"
                    ? column.id
                    : String(column.columnDef.header ?? column.id)}
                </label>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
