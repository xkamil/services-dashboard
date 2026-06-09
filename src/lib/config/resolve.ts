/**
 * Pure helpers that turn the raw {@link AppConfig} document into the *effective*
 * config the dashboard renders: defaults merged with overrides, and `${...}`
 * placeholders substituted from the environment's variables.
 *
 * Everything here is side-effect free and unit-tested in `tests/config-resolve.test.ts`.
 */

import type {
  AppConfig,
  EnvironmentBase,
  ServiceBase,
} from "~/lib/config/schema";

type LinkMap = Record<string, string | null | undefined>;

type MergedService = { links: LinkMap };
type MergedEnvironment = { variables: Record<string, string>; links: LinkMap };

/** A service after inheritance + placeholder substitution, ready to render. */
export type ResolvedService = {
  name: string;
  /** Team or person responsible for the service. */
  owner: string;
  /** Label → URL, with null/unset links dropped and placeholders substituted. */
  links: Record<string, string>;
  /** Placeholder names that had no value in context (surfaced as warnings). */
  unresolved: string[];
};

/** URL-safe slug for an environment name, used in `/environments/[env]` routes. */
export function environmentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** An environment after inheritance + placeholder substitution. */
export type ResolvedEnvironment = {
  name: string;
  variables: Record<string, string>;
  links: Record<string, string>;
  services: ResolvedService[];
};

/**
 * Merges two link maps. Keys absent from `override` are inherited from `base`;
 * keys present in `override` win (including an explicit `null`, which disables
 * an inherited link); new keys are added.
 */
export function mergeLinkMaps(base: LinkMap = {}, override: LinkMap = {}): LinkMap {
  return { ...base, ...override };
}

/** Merges a service base with a partial override (override wins per field). */
export function mergeServiceBase(
  base: ServiceBase | MergedService,
  override: Partial<ServiceBase> = {},
): MergedService {
  return {
    links: mergeLinkMaps(base.links, override.links),
  };
}

/** Merges an environment base with a partial override. */
export function mergeEnvironmentBase(
  base: EnvironmentBase,
  override: Partial<EnvironmentBase> = {},
): MergedEnvironment {
  return {
    variables: { ...base.variables, ...(override.variables ?? {}) },
    links: mergeLinkMaps(base.links, override.links),
  };
}

const PLACEHOLDER = /\$\{([^}]+)\}/g;

/**
 * Replaces `${name}` occurrences in a string from `context`. Unknown names are
 * left untouched and reported via `unresolved`.
 */
export function substituteString(
  value: string,
  context: Record<string, string>,
  unresolved: Set<string>,
): string {
  return value.replace(PLACEHOLDER, (match, rawName: string) => {
    const name = rawName.trim();
    if (name in context) return context[name]!;
    unresolved.add(name);
    return match;
  });
}

/** Builds the placeholder lookup for a resolved environment. */
function buildContext(
  envName: string,
  variables: Record<string, string>,
): Record<string, string> {
  return { envName, ...variables };
}

/** Drops unset links and substitutes placeholders in the remaining URLs. */
function resolveLinks(
  links: LinkMap,
  context: Record<string, string>,
  unresolved: Set<string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [label, url] of Object.entries(links)) {
    if (url == null) continue;
    out[label] = substituteString(url, context, unresolved);
  }
  return out;
}

/** Resolves a single service on a given environment. */
export function resolveService(
  config: AppConfig,
  envName: string,
  serviceName: string,
): ResolvedService | null {
  const env = config.environments.find((e) => e.name === envName);
  const service = config.services.find((s) => s.name === serviceName);
  if (!env || !service) return null;

  // A matching entry in the environment's `services` array is a per-environment
  // override applied on top of the catalog service.
  const envOverride = env.services.find((s) => s.name === serviceName);

  let merged = mergeServiceBase(config.defaults.service, service);
  if (envOverride) {
    merged = mergeServiceBase(merged, { links: envOverride.links });
  }

  const variables = {
    ...config.defaults.environment.variables,
    ...env.variables,
  };
  const context = buildContext(env.name, variables);
  const unresolved = new Set<string>();

  return {
    name: service.name,
    owner: service.owner,
    links: resolveLinks(merged.links, context, unresolved),
    unresolved: [...unresolved],
  };
}

/** Resolves an environment: merged env fields plus all its resolved services. */
export function resolveEnvironment(
  config: AppConfig,
  envName: string,
): ResolvedEnvironment | null {
  const env = config.environments.find((e) => e.name === envName);
  if (!env) return null;

  const base = mergeEnvironmentBase(config.defaults.environment, env);
  const context = buildContext(env.name, base.variables);
  const unresolved = new Set<string>();

  // Every catalog service is present on every environment; the env's own
  // `services` entries only override per-environment details.
  const services = config.services
    .map((service) => resolveService(config, envName, service.name))
    .filter((s): s is ResolvedService => s !== null);

  return {
    name: env.name,
    variables: base.variables,
    links: resolveLinks(base.links, context, unresolved),
    services,
  };
}

/** Resolves every environment in the config. */
export function resolveAll(config: AppConfig): ResolvedEnvironment[] {
  return config.environments
    .map((env) => resolveEnvironment(config, env.name))
    .filter((e): e is ResolvedEnvironment => e !== null);
}
