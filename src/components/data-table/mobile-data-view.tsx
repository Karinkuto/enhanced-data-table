"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import type { Row } from "@tanstack/react-table"
import { Check, ChevronDown, Loader, X, Copy, Edit, Trash } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Portal } from "@/components/ui/portal"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

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
  }[]
  emptyState?: React.ReactNode
}

export function MobileDataView<TData>({
  data,
  renderHeader,
  renderSubheader,
  renderDetailRows,
  onRowAction,
  batchActions = [
    {
      label: "Copy",
      icon: <Copy className="h-3.5 w-3.5" />,
      onClick: (selectedIds) => {
        const selectedRows = data.filter((row) => selectedIds.includes(row.id))
        navigator.clipboard.writeText(JSON.stringify(selectedRows.map((row) => row.original), null, 2))
        toast.info("Selected rows copied to clipboard", { position: "top-center" })
      },
    },
    {
      label: "Edit",
      icon: <Edit className="h-3.5 w-3.5" />,
      onClick: () => toast.info("Edit selected rows", { position: "top-center" }),
    },
    {
      label: "Delete",
      icon: <Trash className="h-3.5 w-3.5" />,
      onClick: (selectedIds) => {
        const selectedRows = data.filter((row) => selectedIds.includes(row.id))
        toast.info(`Deleted ${selectedRows.length} ${selectedRows.length === 1 ? "row" : "rows"}`, { position: "top-center" })
      },
    },
  ],
  emptyState,
}: MobileDataViewProps<TData>) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [currentAction, setCurrentAction] = useState<string | null>(null)

  // Reset selection mode when there are no selected items
  useEffect(() => {
    if (selectedItems.length === 0 && isSelectionMode) {
      setIsSelectionMode(false)
    } else if (selectedItems.length > 0 && !isSelectionMode) {
      setIsSelectionMode(true)
    }
  }, [selectedItems, isSelectionMode])

  // Clear selection on Escape key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && selectedItems.length > 0) {
        setSelectedItems([])
        toast.info("Selection cleared", { position: "top-center" })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedItems])

  const handleAccordionChange = (value: string) => {
    // Don't toggle accordion in selection mode to avoid confusion
    if (isSelectionMode) return

    setExpandedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const handleTouchStart = (e: React.TouchEvent, rowId: string) => {
    // If already in selection mode, don't use long press
    if (isSelectionMode) return

    const touch = e.touches[0]
    setTouchPosition({ x: touch.clientX, y: touch.clientY })

    const timer = setTimeout(() => {
      // Only select if the user hasn't moved significantly
      if (touchPosition) {
        toggleRowSelection(rowId)
      }
    }, 300) // Reduced to 300ms for better responsiveness

    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPosition || isSelectionMode) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchPosition.x)
    const deltaY = Math.abs(touch.clientY - touchPosition.y)

    // If user has moved significantly, cancel long press
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
    setSelectedItems((prev) => {
      const isSelected = prev.includes(rowId)
      const newSelection = isSelected ? prev.filter((id) => id !== rowId) : [...prev, rowId]

      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      return newSelection
    })
  }

  const handleRowClick = (rowId: string) => {
    if (isSelectionMode) {
      toggleRowSelection(rowId)
    } else if (onRowAction) {
      const row = data.find((r) => r.id === rowId)
      if (row) onRowAction(row)
    }
  }

  const selectAll = () => {
    setSelectedItems(data.map((row) => row.id))
    toast.success("All items selected", { duration: 1500, position: "top-center" })
  }

  const deselectAll = () => {
    setSelectedItems([])
    toast.info("Selection cleared", { duration: 1500, position: "top-center" })
  }

  const handleBatchAction = (action: MobileDataViewProps<TData>["batchActions"][0], index: number) => {
    setCurrentAction(action.label)

    startTransition(async () => {
      try {
        await action.onClick(selectedItems)
      } catch (error) {
        toast.error("An error occurred")
        console.error(error)
      } finally {
        setCurrentAction(null)
      }
    })
  }

  if (data.length === 0 && emptyState) {
    return <div className="py-8">{emptyState}</div>
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {isSelectionMode && (
          <Portal>
            <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit px-2.5">
              <div className="w-full overflow-x-auto">
                <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-background p-2 text-foreground shadow-sm">
                  <div className="flex h-7 items-center rounded-md border border-dashed pr-1 pl-2.5">
                    <span className="whitespace-nowrap text-xs">{selectedItems.length} selected</span>
                    <Separator orientation="vertical" className="mr-1 ml-2" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-5 hover:border" onClick={deselectAll}>
                          <X className="size-3.5 shrink-0" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center border bg-accent px-2 py-1 font-semibold text-foreground">
                        <p className="mr-2">Clear selection</p>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          Esc
                        </kbd>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Separator orientation="vertical" className="hidden h-5 sm:block" />
                  <div className="flex items-center gap-1.5">
                    {selectedItems.length < data.length && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" size="icon" className="size-7 border" onClick={selectAll}>
                            <Check className="size-3.5" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="border bg-accent font-semibold text-foreground">
                          <p>Select all</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {batchActions.map((action, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-7 border"
                            onClick={() => handleBatchAction(action, index)}
                            disabled={isPending}
                          >
                            {isPending && currentAction === action.label ? (
                              <Loader className="size-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              action.icon
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="border bg-accent font-semibold text-foreground">
                          <p>{action.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )}

        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-2">
          {data.map((row) => {
            const isSelected = selectedItems.includes(row.id)
            const isExpanded = expandedItems.includes(row.id)

            return (
              <AccordionItem
                key={row.id}
                value={row.id}
                className={cn(
                  "rounded-md border overflow-hidden bg-card mb-2 relative transition-all duration-200 data-[state=open]:bg-muted/30",
                  isSelected && "border-primary ring-1 ring-primary bg-primary/5",
                  !isSelectionMode && "hover:bg-muted/40",
                )}
                onTouchStart={(e) => handleTouchStart(e, row.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-selected={isSelected ? "true" : "false"}
                aria-selected={isSelected}
                onClick={(e) => {
                  if (!isSelectionMode) {
                    handleAccordionChange(row.id)
                  }
                }}
              >
                <div
                  className="relative px-4 pt-3 pb-2"
                  onClick={(e) => {
                    if (isSelectionMode) {
                      e.stopPropagation()
                      handleRowClick(row.id)
                    }
                  }}
                >
                  {isSelected && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}

                  <div className={cn("flex flex-col items-start text-left w-full", isSelected && "pl-6")}>
                    <div className="font-medium text-base w-full">{renderHeader(row)}</div>
                    <div className="text-muted-foreground text-sm">{renderSubheader(row)}</div>
                  </div>

                  <div className="absolute bottom-2 right-4">
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")}
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    />
                  </div>
                </div>

                <AccordionTrigger
                  className="sr-only"
                  onClick={(e) => {
                    e.preventDefault()
                    if (!isSelectionMode) {
                      handleAccordionChange(row.id)
                    }
                  }}
                >
                  <span className="sr-only">Toggle content</span>
                </AccordionTrigger>

                <AccordionContent className="px-0 pb-0 animate-in fade-in-50 duration-200">
                  <div className="overflow-hidden">
                    <Table>
                      <TableBody>
                        {renderDetailRows(row).map((detailRow, index) => (
                          <TableRow key={index} className="border-t border-border hover:bg-muted/50 transition-colors">
                            {detailRow}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </TooltipProvider>
  )
}