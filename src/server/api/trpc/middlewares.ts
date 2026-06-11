import { recordAuditLog } from "~/server/audit";
import { t } from "~/server/api/trpc/init";

export const timingMiddleware = t.middleware(async ({ next, path }) => {
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
export const auditMiddleware = t.middleware(
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
