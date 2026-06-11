import { serviceVersionSchema } from "~/lib/validation/version";
import { createTRPCRouter } from "~/server/api/trpc/init";
import { protectedProcedure } from "~/server/api/trpc/procedures";

interface ServiceVersion {
  version?: string;
  versionToCompareWith?: string;
}

/**
 * Resolves the deployed version of a service on an environment (and the version
 * to compare it against).
 *
 * TODO: replace this stub with a real lookup — calling the service's exposed
 * version endpoint (or another upstream source) per environment. Everything
 * below the {@link fetchServiceVersion} signature is throwaway simulation:
 *  - deterministic sample versions, keyed by a hash of `envName + serviceName`
 *    so a given service stays stable across renders and reloads;
 *  - a random 200–2000ms delay to mimic per-service network latency, so the
 *    dashboard's loading spinners are exercised realistically.
 */
async function fetchServiceVersion(
  envName: string,
  serviceName: string,
): Promise<ServiceVersion> {
  const SAMPLE_VERSIONS: ServiceVersion[] = [
    { version: "1.4.2", versionToCompareWith: "1.4.0" }, // greater → up / green
    { version: "2.0.0", versionToCompareWith: "2.0.0" }, // equal → equal / blue
    { version: "1.2.3", versionToCompareWith: "1.3.0" }, // less → down / red
    { version: undefined, versionToCompareWith: "1.0.0" }, // unknown → ? / gray
    { version: "1.2.3-feat-some-new-feature", versionToCompareWith: "1.2.3" }, // suffixed → greater + truncated
  ];

  const seed = `${envName}/${serviceName}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  const delayMs = 200 + Math.floor(Math.random() * 1800); // 200–2000ms
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return SAMPLE_VERSIONS[hash % SAMPLE_VERSIONS.length]!;
}

export const versionRouter = createTRPCRouter({
  /** The deployed version of a service on an environment, and what to compare it with. */
  getForService: protectedProcedure
    .input(serviceVersionSchema)
    .query(({ input }) => fetchServiceVersion(input.envName, input.serviceName)),
});
