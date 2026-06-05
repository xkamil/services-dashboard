import { type PrismaClient } from "../../../generated/prisma";
import { type SecretKey } from "~/lib/secrets";

import { decryptSecret } from "./crypto";

/**
 * Retrieves and decrypts a user's secret for use in outbound API calls.
 * Returns null if the user has not set this secret.
 *
 * Example:
 *   const token = await getUserSecret(ctx.db, ctx.session.userId, "GITHUB_API_TOKEN");
 *   if (token) await fetch("https://api.github.com/...", {
 *     headers: { Authorization: `Bearer ${token}` },
 *   });
 */
export async function getUserSecret(
  db: PrismaClient,
  userId: string,
  key: SecretKey,
): Promise<string | null> {
  const row = await db.userSecret.findUnique({
    where: { userId_key: { userId, key } },
    select: { ciphertext: true },
  });
  return row ? decryptSecret(row.ciphertext) : null;
}

/**
 * Like {@link getUserSecret} but throws when the secret is missing — for code
 * paths that cannot proceed without it.
 */
export async function requireUserSecret(
  db: PrismaClient,
  userId: string,
  key: SecretKey,
): Promise<string> {
  const value = await getUserSecret(db, userId, key);
  if (!value) {
    throw new Error(`Missing required secret "${key}" for user ${userId}.`);
  }
  return value;
}
