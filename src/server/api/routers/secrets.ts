import { SECRET_KEYS, SECRET_META } from "~/lib/secrets";
import {
  removeSecretSchema,
  setSecretSchema,
} from "~/lib/validation/secrets";
import { createTRPCRouter } from "~/server/api/trpc/init";
import { protectedProcedure } from "~/server/api/trpc/procedures";
import { encryptSecret } from "~/server/secrets/crypto";

export const secretsRouter = createTRPCRouter({
  /**
   * Lists every supported secret with whether the current user has set it.
   * Never returns the stored value or ciphertext.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.userSecret.findMany({
      where: { userId: ctx.session.userId },
      select: { key: true, updatedAt: true },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.updatedAt]));

    return SECRET_KEYS.map((key) => ({
      key,
      label: SECRET_META[key].label,
      description: SECRET_META[key].description,
      helpUrl: SECRET_META[key].helpUrl ?? null,
      isSet: byKey.has(key),
      updatedAt: byKey.get(key) ?? null,
    }));
  }),

  /** Encrypts and stores (or overwrites) a secret for the current user. */
  set: protectedProcedure
    .input(setSecretSchema)
    .mutation(async ({ ctx, input }) => {
      const ciphertext = encryptSecret(input.value);
      await ctx.db.userSecret.upsert({
        where: {
          userId_key: { userId: ctx.session.userId, key: input.key },
        },
        create: { userId: ctx.session.userId, key: input.key, ciphertext },
        update: { ciphertext },
      });
      return { success: true };
    }),

  /** Removes a stored secret for the current user. */
  remove: protectedProcedure
    .input(removeSecretSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userSecret.deleteMany({
        where: { userId: ctx.session.userId, key: input.key },
      });
      return { success: true };
    }),
});
