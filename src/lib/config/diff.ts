/**
 * Structured diff between two config snapshots, used by the history UI to show
 * what changed between versions. Thin wrapper over `microdiff`.
 */

import diff, { type Difference } from "microdiff";

export type ConfigChange = {
  /** Dotted path to the changed value, e.g. `environments.0.variables.REGION`. */
  path: string;
  type: Difference["type"]; // "CREATE" | "REMOVE" | "CHANGE"
  oldValue?: unknown;
  newValue?: unknown;
};

/** Returns the list of changes turning `from` into `to`. */
export function diffConfig(from: unknown, to: unknown): ConfigChange[] {
  return diff(
    from as Record<string, unknown>,
    to as Record<string, unknown>,
  ).map((d) => ({
    path: d.path.join("."),
    type: d.type,
    oldValue: "oldValue" in d ? (d.oldValue as unknown) : undefined,
    newValue: "value" in d ? (d.value as unknown) : undefined,
  }));
}
