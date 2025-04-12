import type { FilterFn } from "@tanstack/react-table"
import { rankItem, type RankingInfo } from "@tanstack/match-sorter-utils"

// Declare module extensions
declare module "@tanstack/react-table" {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Type-safe fuzzy filter function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Skip filter if value is empty
  if (!value || value === "") return true

  // If searching all columns
  if (columnId === "all") {
    // Get searchable values from the row
    const rowValues = Object.entries(row.original as Record<string, unknown>)
      .filter(([key, val]) => {
        // Skip null/undefined values and non-primitive values
        return val != null && 
               (typeof val === 'string' || 
                typeof val === 'number' || 
                typeof val === 'boolean') &&
               !['id', 'select', 'actions'].includes(key);
      })
      .map(([, val]) => String(val).toLowerCase());
    
    // Convert search value to lowercase
    const searchValue = String(value).toLowerCase();

    // Check if any value contains the search string (permissive matching)
    // This is more reliable than the complex ranking system for basic searches
    const exactMatches = rowValues.some(val => val.includes(searchValue));
    if (exactMatches) return true;
    
    // If no exact matches, try fuzzy matching
    for (const rowValue of rowValues) {
      const result = rankItem(rowValue, searchValue);
      if (result.passed) {
        addMeta({ itemRank: result });
        return true;
      }
    }
    
    return false;
  }

  // For specific column searching (not "all")
  const getValue = row.getValue(columnId);
  
  // Skip if value is undefined, null or an object
  if (getValue == null) return false;
  
  // Convert to string for comparison
  const itemValue = String(getValue).toLowerCase();
  const searchValue = String(value).toLowerCase();
  
  // First try simple contains matching
  if (itemValue.includes(searchValue)) return true;
  
  // If that fails, try fuzzy matching
  const itemRank = rankItem(itemValue, searchValue);
  addMeta({ itemRank });
  
  return itemRank.passed;
} 