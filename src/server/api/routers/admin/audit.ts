import { auditLogListSchema } from "~/lib/validation/admin";
import { createTRPCRouter } from "~/server/api/trpc/init";
import { adminProcedure } from "~/server/api/trpc/procedures";

export const auditRouter = createTRPCRouter({
  list: adminProcedure.input(auditLogListSchema).query(({ ctx, input }) => {
    return ctx.db.auditLog.findMany({
      where: { createdAt: { gte: input.from, lte: input.to } },
      orderBy: { createdAt: "desc" },
    });
  }),
});
