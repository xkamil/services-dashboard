/**
 * Single source of truth for the per-user secrets the app supports.
 *
 * Kept dependency-light (no zod, no next imports) like `src/lib/roles.ts`, so it
 * is safe to import from server, client, and edge code.
 *
 * To add a new secret: append its key to `SECRET_KEYS` and add a matching
 * `SECRET_META` entry. Nothing else needs to change.
 */

export const SECRET_KEYS = ["JENKINS_API_TOKEN"] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];

/** How each secret is presented to the user in the management UI. */
export const SECRET_META: Record<
  SecretKey,
  { label: string; description: string; helpUrl?: string }
> = {
  JENKINS_API_TOKEN: {
    label: "Jenkins API token",
    description: "API token used by the backend to authenticate to Jenkins.",
  },
};

/** Narrows an arbitrary string to a known secret key. */
export function isSecretKey(value: string): value is SecretKey {
  return (SECRET_KEYS as readonly string[]).includes(value);
}
