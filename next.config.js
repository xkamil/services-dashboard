/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Ensure the Prisma query engine binary is bundled into Vercel's
  // serverless functions (Next.js tracing doesn't pick up the .so.node otherwise).
  outputFileTracingIncludes: {
    "/**/*": ["./generated/prisma/**/*"],
  },
};

export default config;
