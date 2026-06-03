import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { recordAuditLog } from "~/server/audit";
import { getSession } from "~/server/auth";
import { db } from "~/server/db";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await getSession();
  const sessionData =
    session.userId
      ? {
          userId: session.userId,
          email: session.email,
          role: session.role,
          isTemporaryPassword: session.isTemporaryPassword,
        }
      : null;

  return {
    db,
    session: sessionData,
    ironSession: session,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  return result;
});

// Records successful admin mutations to the audit log (the changelog). Runs
// before auth so the actor reflects the caller's session at request time.
const auditMiddleware = t.middleware(
  async ({ ctx, next, path, type, getRawInput }) => {
    const result = await next();

    // Only admin actions are recorded in the changelog.
    if (type === "mutation" && result.ok && path.startsWith("admin.")) {
      const input = await getRawInput();
      await recordAuditLog(ctx.db, {
        action: path,
        actor: ctx.session
          ? { userId: ctx.session.userId, email: ctx.session.email }
          : null,
        input,
      });
    }

    return result;
  },
);

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

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
