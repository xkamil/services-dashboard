import { type PrismaClient } from "../../generated/prisma";

// Keys whose values must never be persisted to the audit log.
const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "confirmpassword",
  "passwordhash",
]);

const REDACTED = "***";

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) =>
        SENSITIVE_KEYS.has(key.toLowerCase())
          ? [key, REDACTED]
          : [key, sanitize(val)],
      ),
    );
  }
  return value;
}

type Actor = { userId: string; email: string } | null;

/**
 * Persists a record of a successful mutation. Failures here are swallowed so
 * audit logging can never break the action it is recording.
 */
export async function recordAuditLog(
  db: PrismaClient,
  params: { action: string; actor: Actor; input: unknown },
) {
  try {
    const sanitized = sanitize(params.input);
    await db.auditLog.create({
      data: {
        action: params.action,
        userId: params.actor?.userId ?? null,
        userEmail: params.actor?.email ?? null,
        input:
          sanitized === undefined ? null : JSON.stringify(sanitized),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record mutation", params.action, error);
  }
}
