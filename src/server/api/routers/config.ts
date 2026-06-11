import { TRPCError } from "@trpc/server";

import { diffConfig } from "~/lib/config/diff";
import { appConfigSchema } from "~/lib/config/schema";
import { resolveAll, resolveEnvironment } from "~/lib/config/resolve";
import {
  diffConfigSchema,
  configVersionSchema,
  resolveConfigSchema,
  revertConfigSchema,
  saveConfigSchema,
} from "~/lib/validation/config";
import {
  createConfigVersion,
  getCurrentConfig,
  getCurrentConfigVersion,
  revertToVersion,
} from "~/server/config";
import { createTRPCRouter } from "~/server/api/trpc/init";
import {
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc/procedures";

export const configRouter = createTRPCRouter({
  /** The active config document, for the editor and any consumer. */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const current = await getCurrentConfigVersion(ctx.db);
    if (!current) return null;
    return {
      version: current.version,
      authorEmail: current.authorEmail,
      message: current.message,
      createdAt: current.createdAt,
      data: appConfigSchema.parse(JSON.parse(current.data)),
    };
  }),

  /** Resolved (merged + placeholder-substituted) view for the dashboard. */
  getResolved: protectedProcedure
    .input(resolveConfigSchema)
    .query(async ({ ctx, input }) => {
      const config = await getCurrentConfig(ctx.db);
      if (!config) return { environments: [] };

      if (input.envName) {
        const env = resolveEnvironment(config, input.envName);
        return { environments: env ? [env] : [] };
      }
      return { environments: resolveAll(config) };
    }),

  /** Version history metadata (newest first). Admin-only. */
  history: adminProcedure.query(({ ctx }) => {
    return ctx.db.configVersion.findMany({
      orderBy: { version: "desc" },
      select: {
        version: true,
        message: true,
        authorEmail: true,
        createdAt: true,
      },
    });
  }),

  /** Full data of a single version. Admin-only. */
  getVersion: adminProcedure
    .input(configVersionSchema)
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.configVersion.findUnique({
        where: { version: input.version },
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return {
        version: row.version,
        authorEmail: row.authorEmail,
        message: row.message,
        createdAt: row.createdAt,
        data: appConfigSchema.parse(JSON.parse(row.data)),
      };
    }),

  /** Structured diff between two versions. Admin-only. */
  diff: adminProcedure.input(diffConfigSchema).query(async ({ ctx, input }) => {
    const [from, to] = await Promise.all([
      ctx.db.configVersion.findUnique({ where: { version: input.from } }),
      ctx.db.configVersion.findUnique({ where: { version: input.to } }),
    ]);
    if (!from || !to) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return diffConfig(JSON.parse(from.data), JSON.parse(to.data));
  }),

  /** Save a new version. Admin-only; recorded in the changelog. */
  save: adminProcedure
    .input(saveConfigSchema)
    .mutation(({ ctx, input }) => {
      return createConfigVersion(ctx.db, {
        data: input.data,
        message: input.message,
        actor: { userId: ctx.session.userId, email: ctx.session.email },
      });
    }),

  /** Revert to an earlier version by appending a copy. Admin-only. */
  revert: adminProcedure
    .input(revertConfigSchema)
    .mutation(({ ctx, input }) => {
      return revertToVersion(ctx.db, input.version, {
        userId: ctx.session.userId,
        email: ctx.session.email,
      });
    }),
});
