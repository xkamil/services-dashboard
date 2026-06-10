import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

import { env } from "~/env";
import { type PrismaClient } from "../../generated/prisma";

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  isTemporaryPassword: boolean;
  /**
   * Epoch ms of the last time the role was validated against the database. The
   * backend trusts the cookie's role for `MAX_SESSION_AGE_MS`, then re-fetches.
   * Optional so cookies issued before this field existed are treated as stale.
   */
  refreshedAt?: number;
}

/**
 * How long the role in the cookie is trusted before being re-checked, in ms.
 * Configurable via `SESSION_MAX_AGE_SECONDS` (defaults to 60s).
 */
export const MAX_SESSION_AGE_MS = env.SESSION_MAX_AGE_SECONDS * 1000;

export const sessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: "app-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/**
 * Returns the authenticated user's session fields, refreshing the role from the
 * database when the session is older than `MAX_SESSION_AGE_MS`.
 *
 * Within the trust window the cookie's role is used as-is (no DB read). Once it
 * goes stale we re-fetch, rewrite the cookie with the current role and a new
 * `refreshedAt`, and use those values — so a role change takes effect within the
 * window rather than persisting until logout. Returns `null` when the request is
 * unauthenticated or the user has been deleted (in which case the session is
 * destroyed).
 *
 * Must run where setting a cookie is allowed (a Route Handler / Server Action,
 * e.g. the tRPC context) — never during a Server Component render.
 */
export async function refreshSessionIfStale(
  session: IronSession<SessionData>,
  db: PrismaClient,
): Promise<SessionData | null> {
  if (!session.userId) return null;

  // A missing `refreshedAt` (cookie predates this field) counts as stale.
  const isStale =
    !session.refreshedAt ||
    Date.now() - session.refreshedAt > MAX_SESSION_AGE_MS;

  if (isStale) {
    const fresh = await db.user.findUnique({
      where: { id: session.userId },
      select: { role: true, isTemporaryPassword: true },
    });

    if (!fresh) {
      session.destroy();
      return null;
    }

    session.role = fresh.role;
    session.isTemporaryPassword = fresh.isTemporaryPassword;
    session.refreshedAt = Date.now();
    await session.save();
  }

  return {
    userId: session.userId,
    email: session.email,
    role: session.role,
    isTemporaryPassword: session.isTemporaryPassword,
    refreshedAt: session.refreshedAt,
  };
}
