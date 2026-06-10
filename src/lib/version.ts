/**
 * Pure helpers for comparing service versions. Side-effect free and shared by
 * the dashboard filter (which buckets services by comparison category) and the
 * {@link VersionBadge} (which renders the resulting indicator).
 *
 * Unit-tested in `tests/version.test.ts`.
 */

/** How a `version` relates to the `versionToCompareWith` it is checked against. */
export type Comparison = "greater" | "equal" | "less" | "unknown";

interface ParsedVersion {
  parts: [number, number, number];
  /** Branch suffix after the first `-`, e.g. `feat-some-new-feature`; `""` if none. */
  suffix: string;
}

/**
 * Parses a semantic version with an optional branch suffix
 * (e.g. `1.2.3-feat-some-new-feature`).
 */
export function parseSemver(version: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version.trim());
  if (!match) return null;
  return {
    parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    suffix: match[4] ?? "",
  };
}

/** Compares two versions, returning `unknown` when either is missing/invalid. */
export function compareVersions(
  version?: string,
  versionToCompareWith?: string,
): Comparison {
  if (!version || !versionToCompareWith) return "unknown";
  const a = parseSemver(version);
  const b = parseSemver(versionToCompareWith);
  if (!a || !b) return "unknown";
  for (let i = 0; i < 3; i++) {
    if (a.parts[i]! > b.parts[i]!) return "greater";
    if (a.parts[i]! < b.parts[i]!) return "less";
  }
  // Numeric parts are equal: a branch build (with suffix) sits on top of the
  // plain release, so the suffixed version is considered the higher one.
  if (a.suffix === b.suffix) return "equal";
  if (!a.suffix) return "less";
  if (!b.suffix) return "greater";
  return a.suffix > b.suffix ? "greater" : "less";
}
