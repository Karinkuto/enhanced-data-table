"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

import { cn } from "@/lib/utils"
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchableColumn {
  id: string
  label: string
}

interface SearchCommandProps {
  columns: SearchableColumn[]
  selectedColumn?: string
  onColumnChange?: (column: string) => void
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  showColumnSelection?: boolean
}

export function SearchCommand({
  columns,
  selectedColumn = "all",
  onColumnChange,
  searchValue,
  onSearchChange,
  placeholder = "Search...",
  showColumnSelection = true,
}: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [commandFilter, setCommandFilter] = useState("")
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Find the currently selected column
  const selectedColumnLabel = selectedColumn === "all" 
    ? "All columns" 
    : columns.find(col => col.id === selectedColumn)?.label || "All columns"

  return (
    <div className={cn("flex items-center", isDesktop ? "flex-1" : "w-full")}>
      {showColumnSelection ? (
        <Popover open={open} onOpenChange={setOpen}>
          <div className="relative flex-1">
            <div className="flex h-9 rounded-md border border-input bg-background overflow-hidden">
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-full px-3 py-2 flex items-center justify-between border-r text-sm"
                  style={{ borderRadius: 0 }}
                >
                  {selectedColumnLabel}
                </Button>
              </PopoverTrigger>
              <div className="flex-1 flex items-center pl-2">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <Input
                  placeholder={placeholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-full flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <PopoverContent className="p-0 w-[200px]" align="start">
            <Command>
              <CommandInput 
                placeholder="Search columns..." 
                value={commandFilter}
                onValueChange={setCommandFilter}
              />
              <CommandList>
                <CommandEmpty>No columns found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem 
                    onSelect={() => {
                      onColumnChange?.("all")
                      setOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    All columns
                  </CommandItem>
                  {columns
                    .filter(column => 
                      column.label.toLowerCase().includes(commandFilter.toLowerCase())
                    )
                    .map((column) => (
                      <CommandItem
                        key={column.id}
                        onSelect={() => {
                          onColumnChange?.(column.id)
                          setOpen(false)
                        }}
                      >
                        {column.label}
                      </CommandItem>
                    ))
                  }
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="relative flex-1">
          <div className="flex h-9 w-full rounded-md border border-input bg-background overflow-hidden">
            <div className="flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-full flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      )}
    </div>
  )
} 