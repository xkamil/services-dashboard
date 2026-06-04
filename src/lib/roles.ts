/**
 * Single source of truth for the application's role hierarchy.
 *
 * Kept dependency-light (no zod, no next imports) so it is safe to import from
 * edge middleware as well as server and client code.
 */

export const ROLES = ["NON_TECHNICAL", "DEV", "ADMIN", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

/** Higher rank = more privileges. Drives all hierarchical permission checks. */
export const ROLE_RANK: Record<Role, number> = {
  NON_TECHNICAL: 0,
  DEV: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

/** Single source of truth for how each role is labelled and coloured. */
export const ROLE_META: Record<Role, { label: string; palette: string }> = {
  NON_TECHNICAL: { label: "Non-technical", palette: "green" },
  DEV: { label: "Developer", palette: "purple" },
  ADMIN: { label: "Admin", palette: "orange" },
  SUPER_ADMIN: { label: "Super admin", palette: "red" },
};

/** Returns the role if it's a known value, otherwise null. */
export function coerceRole(value: string): Role | null {
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : null;
}

/** Hierarchy check: does `role` meet or exceed `min`? Unknown roles → false. */
export function hasMinRole(role: string, min: Role): boolean {
  const r = coerceRole(role);
  return r !== null && ROLE_RANK[r] >= ROLE_RANK[min];
}
