/**
 * Business rules for the configuration document that go beyond field shapes:
 * uniqueness and cross-references. Applied to `appConfigSchema` via
 * `superRefine` in `schema.ts`.
 */

import { z } from "zod";

/** The slice of the parsed config the cross-reference rules need. */
type ConfigShape = {
  environments: { name: string; services: { name: string }[] }[];
  services: { name: string }[];
};

export function refineAppConfig(config: ConfigShape, ctx: z.RefinementCtx) {
  const dupe = (values: string[]) => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) dupes.add(v);
      seen.add(v);
    }
    return dupes;
  };

  for (const name of dupe(config.environments.map((e) => e.name))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate environment name: ${name}`,
      path: ["environments"],
    });
  }

  const serviceNames = new Set(config.services.map((s) => s.name));
  for (const name of dupe(config.services.map((s) => s.name))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate service name: ${name}`,
      path: ["services"],
    });
  }

  // Every service an environment overrides must exist.
  config.environments.forEach((env, envIdx) => {
    env.services.forEach((svc, svcIdx) => {
      if (!serviceNames.has(svc.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Environment "${env.name}" overrides unknown service "${svc.name}"`,
          path: ["environments", envIdx, "services", svcIdx, "name"],
        });
      }
    });
  });
}
