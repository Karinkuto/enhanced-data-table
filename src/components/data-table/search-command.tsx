"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface SearchableColumn {
  id: string
  label: string
}

interface SearchCommandProps {
  columns: SearchableColumn[]
  selectedColumn: string
  onColumnChange: (column: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  showColumnSelection?: boolean
}

export function SearchCommand({
  columns,
  selectedColumn,
  onColumnChange,
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  showColumnSelection = true,
}: SearchCommandProps) {
  const [open, setOpen] = React.useState(false)
  const selectedColumnLabel = React.useMemo(() => {
    return columns.find((col) => col.id === selectedColumn)?.label || "All"
  }, [columns, selectedColumn])

  return (
    <div className="flex w-full items-center space-x-0">
      {/* Column selector on the left - only shown if showColumnSelection is true */}
      {showColumnSelection && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="rounded-r-none border-r-0 relative w-[120px] justify-between"
            >
              <span className="line-clamp-1 text-sm">{selectedColumnLabel}</span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search column..." />
              <CommandList>
                <CommandEmpty>No column found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      onColumnChange("all")
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedColumn === "all" ? "opacity-100" : "opacity-0")} />
                    All
                  </CommandItem>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={() => {
                        onColumnChange(column.id)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedColumn === column.id ? "opacity-100" : "opacity-0")}
                      />
                      {column.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Search input on the right */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-9", 
            showColumnSelection ? "rounded-l-none" : "rounded-lg"
          )}
        />
      </div>
    </div>
  )
} 