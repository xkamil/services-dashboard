/**
 * Data-access helpers for the versioned configuration document.
 *
 * The current config is always the `ConfigVersion` row with the highest
 * `version`. Saves and reverts only ever *append* a new version, so the full
 * history is immutable and every change is attributable.
 */

import { appConfigSchema, type AppConfig } from "~/lib/config/schema";
import { type PrismaClient } from "../../generated/prisma";

type Actor = { userId: string; email: string } | null;

/** The active version row, or null on a brand-new (unseeded) database. */
export function getCurrentConfigVersion(db: PrismaClient) {
  return db.configVersion.findFirst({ orderBy: { version: "desc" } });
}

/** The active config, parsed and validated. Null when nothing is seeded yet. */
export async function getCurrentConfig(
  db: PrismaClient,
): Promise<AppConfig | null> {
  const current = await getCurrentConfigVersion(db);
  if (!current) return null;
  return appConfigSchema.parse(JSON.parse(current.data));
}

/** Appends a new validated version and returns its metadata. */
export async function createConfigVersion(
  db: PrismaClient,
  params: { data: AppConfig; message?: string; actor: Actor },
) {
  const data = appConfigSchema.parse(params.data);
  const latest = await getCurrentConfigVersion(db);
  const nextVersion = (latest?.version ?? 0) + 1;

  return db.configVersion.create({
    data: {
      version: nextVersion,
      data: JSON.stringify(data),
      message: params.message ?? null,
      authorId: params.actor?.userId ?? null,
      authorEmail: params.actor?.email ?? null,
    },
    select: {
      version: true,
      message: true,
      authorEmail: true,
      createdAt: true,
    },
  });
}

/** Copies an earlier version's data into a new version (auditable revert). */
export async function revertToVersion(
  db: PrismaClient,
  version: number,
  actor: Actor,
) {
  const target = await db.configVersion.findUnique({ where: { version } });
  if (!target) {
    throw new Error(`Config version ${version} not found`);
  }
  const data = appConfigSchema.parse(JSON.parse(target.data));
  return createConfigVersion(db, {
    data,
    message: `Reverted to v${version}`,
    actor,
  });
}
