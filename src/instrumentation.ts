/**
 * Next.js startup hook. Runs once when a server instance boots.
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in the Node.js runtime — Prisma isn't available on the edge,
  // and this is server-startup work, not request handling.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBootstrapAdmin } = await import("~/server/bootstrap");
    await ensureBootstrapAdmin();
  }
}
