"use client"

import * as React from "react"
import { Check, Loader, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Using React's createPortal directly instead of the Portal component
import { createPortal } from "react-dom"

export interface FloatingSelectionControllerProps<TData> {
  selectedItems: string[]
  allItemIds: string[]
  onSelectAll: () => void
  onDeselectAll: () => void
  batchActions: Array<{
    label: string
    icon: React.ReactNode
    onClick: (selectedIds: string[]) => Promise<void> | void
  }>
  currentAction: string | null
  isPending: boolean
  onBatchAction: (
    action: {
      label: string
      icon: React.ReactNode
      onClick: (selectedIds: string[]) => Promise<void> | void
    },
    index: number
  ) => void
}

export function FloatingSelectionController<TData>({
  selectedItems,
  allItemIds,
  onSelectAll,
  onDeselectAll,
  batchActions,
  currentAction,
  isPending,
  onBatchAction
}: FloatingSelectionControllerProps<TData>) {
  const [mounted, setMounted] = React.useState(false)

  // Handle mounting for SSR compatibility
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return null
  }

  const content = (
    <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center">
      <div className="inline-block max-w-[95vw] sm:max-w-[90vw] md:max-w-[600px]">
        <div className="flex flex-col gap-2 rounded-xl border bg-card text-card-foreground p-3 shadow-sm transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between w-full rounded-lg border border-dashed px-3 py-1.5">
            <span className="whitespace-nowrap text-sm font-medium">{selectedItems.length} selected</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="size-6 hover:border rounded-lg" 
              onClick={onDeselectAll}
              onKeyDown={(e) => e.key === 'Enter' && onDeselectAll()}
              aria-label="Clear selection"
            >
              <X className="size-3.5 shrink-0" aria-hidden="true" />
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {selectedItems.length < allItemIds.length && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="size-8 border flex-shrink-0 rounded-lg"
                    onClick={onSelectAll}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectAll()}
                    aria-label="Select all items"
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent px-3 py-1.5 font-semibold text-foreground rounded-lg">
                  <p>Select all</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {batchActions.map((action, actionIndex) => (
              <Tooltip key={`batch-action-${action.label}-${actionIndex}`}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-8 border flex-shrink-0 rounded-lg"
                    onClick={() => onBatchAction(action, actionIndex)}
                    onKeyDown={(e) => e.key === 'Enter' && onBatchAction(action, actionIndex)}
                    disabled={isPending}
                    aria-label={action.label}
                  >
                    {isPending && currentAction === action.label ? (
                      <Loader className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      React.cloneElement(action.icon as React.ReactElement, { 
                        className: "size-4"
                      })
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="border bg-accent px-3 py-1.5 font-semibold text-foreground rounded-lg">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Use createPortal directly
  return createPortal(content, document.body)
} 