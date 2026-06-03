import { TRPCError } from "@trpc/server";

import { deleteUserSchema, updateUserStatusSchema } from "~/lib/validation/admin";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

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

  updateStatus: adminProcedure
    .input(updateUserStatusSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    }),

  delete: adminProcedure
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
});

export const adminRouter = createTRPCRouter({
  users: usersRouter,
});
