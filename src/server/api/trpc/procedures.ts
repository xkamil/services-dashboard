import { TRPCError } from "@trpc/server";

import { hasMinRole, type Role } from "~/lib/roles";
import { auditMiddleware, timingMiddleware } from "~/server/api/trpc/middlewares";
import { t } from "~/server/api/trpc/init";

const baseProcedure = t.procedure.use(timingMiddleware).use(auditMiddleware);

export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});

/** Builds a procedure that requires the caller's role to meet or exceed `min`. */
const roleProcedure = (min: Role) =>
  protectedProcedure.use(({ ctx, next }) => {
    if (!hasMinRole(ctx.session.role, min)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx });
  });

export const adminProcedure = roleProcedure("ADMIN");
export const superAdminProcedure = roleProcedure("SUPER_ADMIN");
