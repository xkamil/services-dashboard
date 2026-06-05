import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import {
  changePasswordServerSchema,
  loginSchema,
  registerServerSchema,
} from "~/lib/validation/auth";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerServerSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "EMAIL_TAKEN" });
      }

      const userCount = await ctx.db.user.count();
      const isFirstUser = userCount === 0;

      const passwordHash = await bcrypt.hash(input.password, 12);

      await ctx.db.user.create({
        data: {
          email: input.email,
          passwordHash,
          isTemporaryPassword: false,
          // Self-registrants are plain USERs, active immediately. The first user
          // (defensive fallback; bootstrap normally beats this) becomes
          // SUPER_ADMIN.
          role: isFirstUser ? "SUPER_ADMIN" : "USER",
        },
      });

      return { isFirstUser };
    }),

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { email: input.email },
    });

    const validPassword =
      user !== null &&
      (await bcrypt.compare(input.password, user.passwordHash));

    if (!user || !validPassword) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "INVALID_CREDENTIALS",
      });
    }

    ctx.ironSession.userId = user.id;
    ctx.ironSession.email = user.email;
    ctx.ironSession.role = user.role;
    ctx.ironSession.isTemporaryPassword = user.isTemporaryPassword;
    await ctx.ironSession.save();

    return { requiresPasswordChange: user.isTemporaryPassword };
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.ironSession.destroy();
    return { success: true };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  changePassword: protectedProcedure
    .input(changePasswordServerSchema)
    .mutation(async ({ ctx, input }) => {
      const passwordHash = await bcrypt.hash(input.newPassword, 12);

      await ctx.db.user.update({
        where: { id: ctx.session.userId },
        data: { passwordHash, isTemporaryPassword: false },
      });

      ctx.ironSession.isTemporaryPassword = false;
      await ctx.ironSession.save();

      return { success: true };
    }),
});
