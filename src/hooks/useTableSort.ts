import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useTableSort<T>(data: T[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: null });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: null }; // reset
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

      // Handle nullish
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;

      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      } else {
        // Date check (ISO string format)
        const aDate = Date.parse(String(aVal));
        const bDate = Date.parse(String(bVal));
        if (!isNaN(aDate) && !isNaN(bDate) && String(aVal).match(/^\d{4}-\d{2}-\d{2}/)) {
          comparison = aDate - bDate;
        } else {
          comparison = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: "base" });
        }
      }

      return sortConfig.direction === "desc" ? -comparison : comparison;
    });
  }, [data, sortConfig]);

  return { sortedData, sortConfig, handleSort };
}
