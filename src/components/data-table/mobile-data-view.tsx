"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Row, Table } from "@tanstack/react-table"
import { Check, ChevronDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table as UITable, TableBody, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

interface MobileDataViewProps<TData> {
  data: Row<TData>[]
  renderHeader: (row: Row<TData>) => React.ReactNode
  renderSubheader: (row: Row<TData>) => React.ReactNode
  renderDetailRows: (row: Row<TData>) => React.ReactNode[]
  onRowAction?: (row: Row<TData>) => void
  batchActions?: {
    label: string
    icon: React.ReactNode
    onClick: (selectedIds: string[]) => Promise<void> | void
    hotkey?: string
  }[]
  emptyState?: React.ReactNode
  table: Table<TData>
}

export function MobileDataView<TData>({
  data,
  renderHeader,
  renderSubheader,
  renderDetailRows,
  onRowAction,
  emptyState,
  table,
}: MobileDataViewProps<TData>) {
  const [expandedItem, setExpandedItem] = useState<string | undefined>(undefined)
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const isSelectionMode = table.getSelectedRowModel().rows.length > 0

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isSelectionMode) {
        table.toggleAllRowsSelected(false)
        toast.info("Selection cleared", { position: "top-center" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isSelectionMode, table])

  const handleAccordionChange = (value: string | undefined) => {
    if (isSelectionMode) return
    setExpandedItem(value)
  }

  const handleTouchStart = (e: React.TouchEvent, rowId: string) => {
    if (isSelectionMode) return
    const touch = e.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })
    const timer = setTimeout(() => {
      if (touchPosition) {
        // If this row's accordion is expanded, collapse it first
        if (expandedItem === rowId) {
          setExpandedItem(undefined);
        }
        toggleRowSelection(rowId)
      }
    }, 300)
    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPosition || isSelectionMode) return
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchPosition.x)
    const deltaY = Math.abs(touch.clientY - touchPosition.y)
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      setTouchPosition(null)
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchPosition(null)
  }

  const toggleRowSelection = (rowId: string) => {
    const row = table.getRowModel().rows.find(r => r.id === rowId)
    if (row) {
      // If this row is expanded, collapse it first
      if (expandedItem === rowId) {
        setExpandedItem(undefined);
      }
      
      row.toggleSelected(!row.getIsSelected())
      if (navigator.vibrate) navigator.vibrate(50)
      
      // Close accordion if selecting a row - this is redundant with the check above but kept for safety
      if (row.getIsSelected()) {
        setExpandedItem(undefined)
      }
    }
  }

  const handleRowClick = (rowId: string) => {
    if (isSelectionMode) {
      // If this row's accordion is expanded, collapse it first
      if (expandedItem === rowId) {
        setExpandedItem(undefined);
      }
      
      toggleRowSelection(rowId)
    } else if (onRowAction) {
      const row = data.find((r) => r.id === rowId)
      if (row) onRowAction(row)
    }
  }

  if (data.length === 0 && emptyState) {
    return <div className="py-8">{emptyState}</div>
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Accordion 
          type="single" 
          value={expandedItem} 
          onValueChange={handleAccordionChange} 
          className="space-y-2"
          collapsible
        >
          {data.map((row) => {
            const isSelected = row.getIsSelected()
            const isExpanded = expandedItem === row.id

            return (
              <AccordionItem
                key={row.id}
                value={row.id}
                className={cn(
                  "bg-card text-card-foreground rounded-xl border shadow-sm overflow-hidden mb-2 relative transition-all duration-500 ease-in-out data-[state=open]:bg-muted/10 last:border-b",
                  isSelected && "border-primary/70 ring-2 ring-primary/30 bg-primary/5",
                  !isSelectionMode && "hover:bg-muted/40",
                )}
                onTouchStart={(e) => handleTouchStart(e, row.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-selected={isSelected ? "true" : "false"}
                aria-selected={isSelected}
                onClick={() => {
                  if (!isSelectionMode) {
                    handleAccordionChange(isExpanded ? undefined : row.id)
                  }
                }}
              >
                <div
                  className="relative px-6 py-4"
                  onClick={() => {
                    if (isSelectionMode) {
                      handleRowClick(row.id)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isSelectionMode && (e.key === 'Enter' || e.key === ' ')) {
                      e.stopPropagation();
                      handleRowClick(row.id);
                    }
                  }}
                  tabIndex={isSelectionMode ? 0 : -1}
                  aria-label={isSelectionMode ? "Toggle row selection" : undefined}
                >
                  <div 
                    className={cn(
                      "absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300 ease-out",
                      isSelected ? 
                        "bg-primary scale-100 opacity-100 shadow-sm shadow-primary/20" : 
                        "bg-transparent scale-75 opacity-0"
                    )}
                  >
                    <Check 
                      className={cn(
                        "h-3 w-3 transition-all duration-300",
                        isSelected ? "text-primary-foreground opacity-100" : "opacity-0"
                      )} 
                    />
                    </div>

                  <div className={cn(
                    "flex flex-col items-start text-left w-full overflow-hidden transition-all duration-300",
                    isSelected ? "pl-6" : "pl-0"
                  )}>
                    <div className="flex justify-between w-full overflow-hidden">
                      <div className="font-medium text-base truncate max-w-[85%]">{renderHeader(row)}</div>
                    </div>
                    {renderSubheader(row) && (
                      <div className="mt-1 w-full overflow-hidden pr-6 pb-1">
                        {renderSubheader(row)}
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out", isExpanded && "rotate-180")}
                      onClick={() => {
                        handleAccordionChange(isExpanded ? undefined : row.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          handleAccordionChange(isExpanded ? undefined : row.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={isExpanded ? "Collapse details" : "Expand details"}
                    />
                  </div>
                </div>

                <AccordionTrigger
                  className="sr-only"
                  onClick={() => {
                    if (!isSelectionMode) {
                      handleAccordionChange(isExpanded ? undefined : row.id)
                    }
                  }}
                >
                  <span className="sr-only">Toggle content</span>
                </AccordionTrigger>

                <AccordionContent className={`px-6 pb-6 pt-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up transition-all duration-300 ease-in-out accordion-content-${row.id}`}>
                  <div className="overflow-x-auto">
                    <UITable className="w-full border-separate border-spacing-0 [&_tr]:border-0 [&_td]:border-0">
                      <TableBody className="divide-y divide-border/30">
                        {renderDetailRows(row).map((detailRow, index) => (
                          <TableRow 
                            key={`detail-row-${row.id}-${index}`} 
                            className="transition-colors hover:bg-transparent"
                          >
                            {detailRow}
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  </div>

                  <style jsx global>{`
                    .accordion-content-${row.id} td:first-child {
                      text-align: left;
                      font-weight: 500;
                      color: hsl(var(--muted-foreground));
                      width: 40%;
                      padding: 1rem 1.5rem 1rem 0.75rem;
                      vertical-align: top;
                      background: transparent;
                      font-size: 0.9rem;
                      letter-spacing: 0.01em;
                    }
                    .accordion-content-${row.id} td:last-child {
                      text-align: left;
                      font-weight: 500;
                      padding: 1rem 0.75rem;
                      vertical-align: top;
                      font-size: 0.95rem;
                    }
                    .accordion-content-${row.id} tr {
                      transition: background-color 0.2s ease;
                    }
                    .accordion-content-${row.id} tr:last-child td {
                      border-bottom: none;
                    }
                  `}</style>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </TooltipProvider>
  )
}