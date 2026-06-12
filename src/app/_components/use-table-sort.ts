"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

/**
 * Client-side sort state for a table: tracks the active column and direction
 * and returns the rows sorted by that column (Date-aware, otherwise compared
 * as strings). Toggling the active column flips the direction; picking a new
 * column resets it to ascending.
 */
export function useTableSort<Row extends object>(
  rows: Row[],
  initialField: keyof Row & string,
  initialDir: SortDir = "asc",
) {
  const [sortField, setSortField] = useState(initialField);
  const [sortDir, setSortDir] = useState<SortDir>(initialDir);

  const toggleSort = (field: keyof Row & string) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp =
        aVal instanceof Date && bVal instanceof Date
          ? aVal.getTime() - bVal.getTime()
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortField, sortDir]);

  return { sorted, sortField, sortDir, toggleSort };
}
