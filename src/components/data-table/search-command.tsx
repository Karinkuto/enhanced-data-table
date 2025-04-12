"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { forwardRef, useEffect, useState } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select"

interface SearchableColumn {
  id: string
  label: string
}

interface SearchCommandProps {
  columns: SearchableColumn[]
  selectedColumn: string
  onColumnChange?: (column: string) => void
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
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  // Find the currently selected column
  const selectedColumnLabel = columns.find(col => col.id === selectedColumn)?.label || "All columns"

  return (
    <div className={cn("flex items-center gap-2", isDesktop ? "" : "w-full")}>
      {showColumnSelection && (
        <Select defaultValue={selectedColumn} onValueChange={onColumnChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Search in..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All columns</SelectItem>
            {columns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      <div className={cn("relative w-full", !isDesktop && "flex-1")}>
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("h-9", isDesktop ? "max-w-sm" : "w-full")}
        />
      </div>
    </div>
  )
} 