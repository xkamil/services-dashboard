/**
 * Single source of truth for the application's configuration document.
 *
 * The whole config is stored as one JSON blob (one row per saved version in the
 * `ConfigVersion` table). This schema both validates edits and gives the app a
 * fully-typed view of the config.
 *
 * Kept dependency-light (only zod) so it is safe to import from client, server
 * and tests alike.
 */

import { z } from "zod";

/** Bumped when the document shape changes in a non-backward-compatible way. */
export const CURRENT_SCHEMA_VERSION = 1 as const;

/**
 * A single link URL. May contain `${placeholder}` references (e.g. `${envName}`,
 * `${baseDomain}`) so it is a plain string, not `z.url()`. `null` means the link
 * is recognised but intentionally not set, and is dropped from the resolved
 * output.
 */
const linkUrl = z.string().min(1).nullable();

/**
 * A service's links, keyed by label. The named keys below are the links the
 * schema recognises for every service; any of them may be `null`, and arbitrary
 * extra `label: url` pairs can be added freely (the `catchall`).
 */
export const serviceLinksSchema = z
  .object({
    repository: linkUrl.optional(),
    logs: linkUrl.optional(),
    swagger: linkUrl.optional(),
    kafka: linkUrl.optional(),
  })
  .catchall(linkUrl);

/** The recognised service link labels, in display order. */
export const KNOWN_SERVICE_LINKS = [
  "repository",
  "logs",
  "swagger",
  "kafka",
] as const;

/** Environment-level links: a free `label: url` map (any value may be null). */
export const environmentLinksSchema = z.record(linkUrl);

/**
 * The inheritable fields of a service. The default service config is exactly a
 * `serviceBase`; concrete services inherit it and may override any field.
 */
export const serviceBaseSchema = z.object({
  links: serviceLinksSchema.default({}),
});

/** The inheritable fields of an environment. */
export const environmentBaseSchema = z.object({
  /** Values usable as placeholders in services on this environment. */
  variables: z.record(z.string()).default({}),
  links: environmentLinksSchema.default({}),
});

/** A concrete service. Identified by `name`; inherits the service defaults. */
export const serviceSchema = z.object({
  name: z.string().min(1),
  /** Team or person responsible for the service. */
  owner: z.string().default("unknown"),
  links: serviceLinksSchema.default({}),
});

/**
 * A per-environment override for one service. Identified by `name` (which must
 * reference a service in the catalog); any other fields it defines override that
 * service's config on this environment only. No `overrides` wrapper is needed —
 * every service is applied to every environment automatically, so an entry here
 * is unambiguously an override.
 */
export const environmentServiceSchema = z.object({
  name: z.string().min(1),
  links: serviceLinksSchema.default({}),
});

/** A concrete environment. Identified by `name`; inherits the env defaults. */
export const environmentSchema = z.object({
  name: z.string().min(1),
  variables: z.record(z.string()).default({}),
  links: environmentLinksSchema.default({}),
  /** Per-environment service overrides (every service is added by default). */
  services: z.array(environmentServiceSchema).default([]),
});

export const appConfigSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    defaults: z.object({
      environment: environmentBaseSchema,
      service: serviceBaseSchema,
    }),
    environments: z.array(environmentSchema).default([]),
    services: z.array(serviceSchema).default([]),
  })
  .superRefine((config, ctx) => {
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
  });

export type ServiceLinks = z.infer<typeof serviceLinksSchema>;
export type ServiceBase = z.infer<typeof serviceBaseSchema>;
export type EnvironmentBase = z.infer<typeof environmentBaseSchema>;
export type ServiceConfig = z.infer<typeof serviceSchema>;
export type EnvironmentConfig = z.infer<typeof environmentSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
