"use client"

import * as React from "react"
import { Check, Loader, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

// Using React's createPortal directly instead of the Portal component
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface FloatingSelectionControllerProps {
  selectedItems: string[]
  allItemIds: string[]
  onSelectAll: () => void
  onDeselectAll: () => void
  batchActions: Array<{
    label: string
    icon: React.ReactNode
    onClick: (selectedIds: string[]) => Promise<void> | void
    hotkey?: string
  }>
  currentAction: string | null
  isPending: boolean
  onBatchAction: (
    action: {
      label: string
      icon: React.ReactNode
      onClick: (selectedIds: string[]) => Promise<void> | void
      hotkey?: string
    },
    index: number
  ) => void
  /** Display mode - "compact" for mobile (icon only) or "full-width" for desktop (text+icon) */
  displayMode?: "compact" | "full-width"
  /** Position - "fixed" for mobile floating UI or "static" for desktop inline UI */
  position?: "fixed" | "static"
  /** Optional className for custom styling */
  className?: string
}

export function FloatingSelectionController({
  selectedItems,
  allItemIds,
  onSelectAll,
  onDeselectAll,
  batchActions,
  currentAction,
  isPending,
  onBatchAction,
  displayMode = "compact",
  position = "fixed",
  className
}: FloatingSelectionControllerProps) {
  const [mounted, setMounted] = React.useState(false)

  // Handle mounting for SSR compatibility
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Setup keyboard shortcuts with native event listeners
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to clear selection
      if (e.key === 'Escape' && selectedItems.length > 0) {
        onDeselectAll();
        return;
      }

      // Skip if component is in a pending state
      if (isPending || displayMode !== 'full-width') return;

      // Check for action hotkeys
      batchActions.forEach((action, index) => {
        if (!action.hotkey) return;
        
        // Parse hotkey format like "alt+e"
        const keys = action.hotkey.toLowerCase().split('+');
        const needsAlt = keys.includes('alt');
        const needsShift = keys.includes('shift');
        const needsCtrl = keys.includes('ctrl') || keys.includes('control');
        const mainKey = keys[keys.length - 1];
        
        if (
          e.key.toLowerCase() === mainKey &&
          e.altKey === needsAlt &&
          e.shiftKey === needsShift &&
          e.ctrlKey === needsCtrl
        ) {
          e.preventDefault();
          if (!isPending) onBatchAction(action, index);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [batchActions, displayMode, isPending, onBatchAction, onDeselectAll, selectedItems.length]);

  if (!mounted) {
    return null
  }

  const isFullWidth = displayMode === "full-width"
  const isFixed = position === "fixed"

  const content = (
    <div 
      className={cn(
        isFixed 
          ? "fixed inset-x-0 bottom-8 z-50 flex justify-center" 
          : "w-full mb-4",
        className
      )}
    >
      <div className={cn(
        isFixed 
          ? "inline-block max-w-[95vw] sm:max-w-[90vw] md:max-w-[600px]" 
          : "w-full"
      )}>
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          isFullWidth
            ? "flex flex-row items-center justify-between gap-4 rounded-md border bg-card text-card-foreground p-2 shadow-sm" 
            : "flex flex-col gap-2 rounded-xl border bg-card text-card-foreground p-3 shadow-sm"
        )}>
          <div className={cn(
            "flex items-center",
            isFullWidth ? "gap-2" : "justify-between w-full rounded-lg border border-dashed px-3 py-1.5"
          )}>
            {isFullWidth ? (
              <>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium gap-1.5">
                  <Check className="size-3.5" />
                  <span>{selectedItems.length} {selectedItems.length === 1 ? "row" : "rows"} selected</span>
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="border-none hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 h-8" 
                  onClick={onDeselectAll}
                  aria-label="Clear selection"
                >
                  <X className="size-3.5 mr-1.5" aria-hidden="true" />
                  Clear
                </Button>
              </>
            ) : (
              <>
                <span className="whitespace-nowrap text-sm font-medium">
                  {selectedItems.length} {selectedItems.length === 1 ? "row" : "rows"} selected
                </span>
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
              </>
            )}
          </div>
          
          {isFullWidth && <Separator orientation="vertical" className="h-9" />}
          
          <div className={cn(
            "flex items-center gap-2",
            isFullWidth ? "justify-end ml-auto" : "flex-wrap justify-center"
          )}>
            {!isFullWidth && selectedItems.length < allItemIds.length && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="secondary" 
                    size={isFullWidth ? "sm" : "icon"}
                    className={cn(
                      "border flex-shrink-0 rounded-lg",
                      !isFullWidth ? "size-8" : ""
                    )}
                    onClick={onSelectAll}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectAll()}
                    aria-label="Select all items"
                  >
                    <Check className="size-4 mr-0" aria-hidden="true" />
                    {isFullWidth && (
                      <span className="ml-1.5">Select all</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className="border bg-accent px-3 py-1.5 font-semibold text-foreground rounded-lg"
                  side={isFullWidth ? "bottom" : "top"}
                >
                  <p>Select all</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {isFullWidth && selectedItems.length < allItemIds.length && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onSelectAll}
                onKeyDown={(e) => e.key === 'Enter' && onSelectAll()}
                className="border flex-shrink-0 rounded-lg h-9 px-3"
              >
                <Check className="size-3.5 mr-1.5" aria-hidden="true" />
                <span>Select all</span>
              </Button>
            )}
            
            {batchActions.map((action, actionIndex) => (
              <React.Fragment key={`batch-action-${action.label}-${actionIndex}`}>
                {isFullWidth ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border flex-shrink-0 rounded-lg h-9 px-3"
                        onClick={() => onBatchAction(action, actionIndex)}
                        onKeyDown={(e) => e.key === 'Enter' && onBatchAction(action, actionIndex)}
                        disabled={isPending}
                      >
                        {isPending && currentAction === action.label ? (
                          <Loader className="size-3.5 animate-spin mr-1.5" aria-hidden="true" />
                        ) : (
                          React.cloneElement(action.icon as React.ReactElement, { 
                            className: "size-3.5 mr-1.5"
                          })
                        )}
                        <span>{action.label}</span>
                      </Button>
                    </TooltipTrigger>
                    {action.hotkey && (
                      <TooltipContent side="bottom" className="px-3 py-1.5">
                        <p><kbd className="px-2 py-0.5 bg-muted rounded border">{action.hotkey}</kbd></p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ) : (
                  <Tooltip>
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
                    <TooltipContent 
                      className="border bg-accent px-3 py-1.5 font-semibold text-foreground rounded-lg"
                      side="top"
                    >
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Use createPortal for fixed position, otherwise render inline
  return isFixed ? createPortal(content, document.body) : content
} 