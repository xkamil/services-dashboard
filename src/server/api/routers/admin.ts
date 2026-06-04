import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { generateTemporaryPassword } from "~/lib/password";
import {
  auditLogListSchema,
  deleteUserSchema,
  resetPasswordSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "~/lib/validation/admin";
import {
  adminProcedure,
  createTRPCRouter,
  superAdminProcedure,
} from "~/server/api/trpc";

const usersRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  updateStatus: superAdminProcedure
    .input(updateUserStatusSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    }),

  updateRole: superAdminProcedure
    .input(updateUserRoleSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),

  delete: superAdminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CANNOT_DELETE_SELF",
        });
      }
      await ctx.db.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),

  resetPassword: superAdminProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const password = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(password, 12);

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { passwordHash, isTemporaryPassword: true },
      });

      return { password };
    }),
});

const auditRouter = createTRPCRouter({
  list: adminProcedure
    .input(auditLogListSchema)
    .query(({ ctx, input }) => {
      return ctx.db.auditLog.findMany({
        where: { createdAt: { gte: input.from, lte: input.to } },
        orderBy: { createdAt: "desc" },
      });
    }),
});

export const adminRouter = createTRPCRouter({
  users: usersRouter,
  audit: auditRouter,
});
