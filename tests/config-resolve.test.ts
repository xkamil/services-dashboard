import { describe, expect, it } from "vitest";

import { appConfigSchema, type AppConfig } from "~/lib/config/schema";
import {
  mergeLinkMaps,
  resolveEnvironment,
  resolveService,
  substituteString,
} from "~/lib/config/resolve";

/** A small but representative config exercising defaults, overrides, links. */
function makeConfig(): AppConfig {
  return appConfigSchema.parse({
    schemaVersion: 1,
    defaults: {
      environment: { variables: { tier: "default" }, links: {} },
      service: { links: { logs: "https://logs/${host}" } },
    },
    environments: [
      {
        name: "Development",
        type: "TEST",
        variables: { host: "dev.example.com" },
        links: { grafana: "https://g.${host}" },
        // Per-environment override for one service (no `overrides` wrapper).
        services: [
          { name: "Payroll", links: { runbook: "https://wiki/${envName}" } },
        ],
      },
    ],
    services: [
      {
        name: "Auth",
        links: { repository: "https://repo/auth", swagger: null },
      },
      { name: "Payroll", links: { logs: "https://custom/${host}/payroll" } },
    ],
  });
}

describe("mergeLinkMaps", () => {
  it("inherits absent keys, overrides present keys, and adds new ones", () => {
    const merged = mergeLinkMaps(
      { repository: "base", logs: "base-logs" },
      { logs: "new-logs", kafka: "k" },
    );
    expect(merged).toEqual({
      repository: "base",
      logs: "new-logs",
      kafka: "k",
    });
  });

  it("lets an explicit null disable an inherited link", () => {
    expect(mergeLinkMaps({ logs: "base" }, { logs: null })).toEqual({
      logs: null,
    });
  });
});

describe("substituteString", () => {
  it("replaces known placeholders and reports unknown ones", () => {
    const unresolved = new Set<string>();
    const out = substituteString(
      "https://${host}/${missing}",
      { host: "h" },
      unresolved,
    );
    expect(out).toBe("https://h/${missing}");
    expect([...unresolved]).toEqual(["missing"]);
  });
});

describe("resolveService", () => {
  it("inherits default links, substitutes variables, and drops null links", () => {
    const service = resolveService(makeConfig(), "Development", "Auth");

    expect(service?.name).toBe("Auth");
    expect(service?.links).toEqual({
      logs: "https://logs/dev.example.com", // inherited from defaults.service
      repository: "https://repo/auth",
    });
    // swagger was null → dropped from the resolved output.
    expect(service?.links.swagger).toBeUndefined();
    expect(service?.unresolved).toEqual([]);
  });

  it("applies service- and environment-level overrides", () => {
    const service = resolveService(makeConfig(), "Development", "Payroll");
    // service overrides the inherited default `logs`...
    expect(service?.links.logs).toBe("https://custom/dev.example.com/payroll");
    // ...and the per-environment override adds a link.
    expect(service?.links.runbook).toBe("https://wiki/Development");
  });
});

describe("resolveEnvironment", () => {
  it("includes every catalog service by default and resolves env links", () => {
    const env = resolveEnvironment(makeConfig(), "Development");

    expect(env?.variables.tier).toBe("default");
    expect(env?.variables.host).toBe("dev.example.com");
    expect(env?.links.grafana).toBe("https://g.dev.example.com");
    // Both services are present even though only Payroll is listed (as an override).
    expect(env?.services.map((s) => s.name)).toEqual(["Auth", "Payroll"]);
  });
});
