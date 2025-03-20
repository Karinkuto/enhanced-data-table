"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { Row } from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MobileDataViewProps<TData> {
  data: Row<TData>[]
  renderHeader: (row: Row<TData>) => React.ReactNode
  renderSubheader: (row: Row<TData>) => React.ReactNode
  renderDetailRows: (row: Row<TData>) => React.ReactNode[]
  onRowAction?: (row: Row<TData>) => void
  rowActions?: (row: Row<TData>) => React.ReactNode
}

export function MobileDataView<TData>({
  data,
  renderHeader,
  renderSubheader,
  renderDetailRows,
  onRowAction,
  rowActions,
}: MobileDataViewProps<TData>) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null)
  
  const handleAccordionChange = (value: string) => {
    setExpandedItems(prev => 
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };
  
  const handleTouchStart = (e: React.TouchEvent, rowId: string) => {
    const touch = e.touches[0];
    setTouchPosition({ x: touch.clientX, y: touch.clientY });
    
    const timer = setTimeout(() => {
      // Only select if the user hasn't moved significantly
      if (touchPosition) {
        setSelectedItems(prev => 
          prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
        );
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        toast.info(
          selectedItems.includes(rowId) ? "Row deselected" : "Row selected", 
          { duration: 1000, position: "bottom-center" }
        );
      }
    }, 800); // 800ms long press
    
    setLongPressTimer(timer);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPosition) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchPosition.x);
    const deltaY = Math.abs(touch.clientY - touchPosition.y);
    
    // If user has moved significantly, cancel long press
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchPosition(null);
    }
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setTouchPosition(null);
  };

  return (
    <div className="space-y-2">
      <Accordion 
        type="multiple" 
        value={expandedItems} 
        onValueChange={setExpandedItems}
        className="space-y-2"
      >
        {data.map((row) => (
          <AccordionItem
            key={row.id}
            value={row.id}
            className={cn(
              "rounded-md border overflow-hidden bg-card mb-2 relative",
              selectedItems.includes(row.id) && "border-primary ring-1 ring-primary bg-primary/5"
            )}
            onTouchStart={(e) => handleTouchStart(e, row.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {rowActions && <div className="absolute top-0 right-0">{rowActions(row)}</div>}
            <div className="flex items-center px-4 pt-3 pb-2 relative">
              <div className={cn(
                "flex-1 transition-all", 
                selectedItems.includes(row.id) && "pl-2"
              )}>
                {selectedItems.includes(row.id) && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-1 bg-primary rounded-full animate-pulse" />
                )}
                <div className="flex flex-col items-start text-left">
                  <div className="font-medium text-base">{renderHeader(row)}</div>
                  <div className="text-muted-foreground text-sm">{renderSubheader(row)}</div>
                </div>
              </div>
            </div>
            
            <AccordionTrigger 
              className="py-2 px-4 hover:no-underline"
              onClick={(e) => {
                e.preventDefault();
                handleAccordionChange(row.id);
              }}
            >
              <div className="absolute right-4 bottom-1">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    expandedItems.includes(row.id) && "rotate-180"
                  )}
                />
              </div>
              <span className="sr-only">Toggle content</span>
            </AccordionTrigger>
            
            <AccordionContent className="px-0 pb-0">
              <div className="overflow-hidden">
                <Table>
                  <TableBody>
                    {renderDetailRows(row).map((detailRow, index) => (
                      <TableRow key={index} className="border-t border-border hover:bg-transparent">
                        {detailRow}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}