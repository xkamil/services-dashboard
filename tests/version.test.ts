import { describe, expect, it } from "vitest";

import { compareVersions, parseSemver } from "~/lib/version";

describe("parseSemver", () => {
  it("parses a plain semver", () => {
    expect(parseSemver("1.2.3")).toEqual({ parts: [1, 2, 3], suffix: "" });
  });

  it("accepts a leading `v` and trims whitespace", () => {
    expect(parseSemver("  v10.0.1 ")).toEqual({ parts: [10, 0, 1], suffix: "" });
  });

  it("captures a branch suffix after the first dash", () => {
    expect(parseSemver("1.2.3-feat-new-thing")).toEqual({
      parts: [1, 2, 3],
      suffix: "feat-new-thing",
    });
  });

  it("returns null for non-semver input", () => {
    expect(parseSemver("nightly")).toBeNull();
    expect(parseSemver("1.2")).toBeNull();
  });
});

describe("compareVersions", () => {
  it("returns unknown when either version is missing", () => {
    expect(compareVersions(undefined, "1.0.0")).toBe("unknown");
    expect(compareVersions("1.0.0", undefined)).toBe("unknown");
    expect(compareVersions(undefined, undefined)).toBe("unknown");
  });

  it("returns unknown when either version is unparseable", () => {
    expect(compareVersions("nightly", "1.0.0")).toBe("unknown");
    expect(compareVersions("1.0.0", "latest")).toBe("unknown");
  });

  it("compares numeric parts in order", () => {
    expect(compareVersions("1.4.2", "1.4.0")).toBe("greater");
    expect(compareVersions("1.2.3", "1.3.0")).toBe("less");
    expect(compareVersions("2.0.0", "1.9.9")).toBe("greater");
  });

  it("treats numerically equal versions as equal", () => {
    expect(compareVersions("2.0.0", "2.0.0")).toBe("equal");
    expect(compareVersions("v1.2.3", "1.2.3")).toBe("equal");
  });

  it("ranks a branch build above the plain release of the same number", () => {
    expect(compareVersions("1.2.3-feat-x", "1.2.3")).toBe("greater");
    expect(compareVersions("1.2.3", "1.2.3-feat-x")).toBe("less");
  });

  it("orders two suffixed builds lexically and equal suffixes as equal", () => {
    expect(compareVersions("1.2.3-b", "1.2.3-a")).toBe("greater");
    expect(compareVersions("1.2.3-a", "1.2.3-a")).toBe("equal");
  });
});
