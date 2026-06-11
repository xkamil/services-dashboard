"use client";

import { useCallback, useEffect, useState } from "react";

/** Prefix for every view-preference key, to namespace our localStorage entries. */
const STORAGE_PREFIX = "view-pref:";

/**
 * A boolean preference backed by localStorage. SSR-safe: it renders with
 * `defaultValue` on the server and first client paint, then reconciles with the
 * stored value after mount (avoiding hydration mismatches). Use this for any
 * show/hide style toggle in the view-options menu.
 *
 * Returns the current value, a setter, a toggler, and a `mounted` flag so
 * callers can defer rendering interactive state until the stored value is known.
 */
export function usePersistentToggle(key: string, defaultValue = false) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [value, setValue] = useState(defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored !== null) setValue(stored === "true");
    } catch {
      // Ignore storage access errors (e.g. privacy mode) and keep the default.
    }
  }, [storageKey]);

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(storageKey, String(next));
      } catch {
        // Persisting is best-effort; the in-memory value still updates.
      }
    },
    [storageKey],
  );

  const toggle = useCallback(() => set(!value), [set, value]);

  return { value, set, toggle, mounted };
}
