"use client";

import { Badge, Box, Center, IconButton } from "@chakra-ui/react";
import { ArrowDown, ArrowUp, Copy, Equal, HelpCircle } from "lucide-react";

import { showErrorToast, showInfoToast } from "~/lib/toast";

export interface VersionBadgeProps {
  /** The version this badge represents (semantic versioning, e.g. `1.4.2`). */
  version?: string;
  /** The version to compare `version` against, driving the indicator. */
  versionToCompareWith?: string;
}

type Comparison = "greater" | "equal" | "less" | "unknown";

/** Max characters of the version shown in the badge before it is truncated. */
const MAX_DISPLAY_LENGTH = 20;

interface ParsedVersion {
  parts: [number, number, number];
  /** Branch suffix after the first `-`, e.g. `feat-some-new-feature`; `""` if none. */
  suffix: string;
}

/**
 * Parses a semantic version with an optional branch suffix
 * (e.g. `1.2.3-feat-some-new-feature`).
 */
function parseSemver(version: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/.exec(version.trim());
  if (!match) return null;
  return {
    parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    suffix: match[4] ?? "",
  };
}

/** Compares two versions, returning `unknown` when either is missing/invalid. */
function compareVersions(
  version?: string,
  versionToCompareWith?: string,
): Comparison {
  if (!version || !versionToCompareWith) return "unknown";
  const a = parseSemver(version);
  const b = parseSemver(versionToCompareWith);
  if (!a || !b) return "unknown";
  for (let i = 0; i < 3; i++) {
    if (a.parts[i]! > b.parts[i]!) return "greater";
    if (a.parts[i]! < b.parts[i]!) return "less";
  }
  // Numeric parts are equal: a branch build (with suffix) sits on top of the
  // plain release, so the suffixed version is considered the higher one.
  if (a.suffix === b.suffix) return "equal";
  if (!a.suffix) return "less";
  if (!b.suffix) return "greater";
  return a.suffix > b.suffix ? "greater" : "less";
}

const COMPARISON_META = {
  greater: { icon: ArrowUp, palette: "green" },
  equal: { icon: Equal, palette: "blue" },
  less: { icon: ArrowDown, palette: "red" },
  unknown: { icon: HelpCircle, palette: "gray" },
} as const satisfies Record<
  Comparison,
  { icon: typeof ArrowUp; palette: string }
>;

/**
 * A rounded badge showing a service `version`, prefixed by a small indicator
 * that reflects how it compares to `versionToCompareWith`:
 * up/green when greater, equal/blue when equal, down/red when lower, and a
 * gray `?` when either version is missing.
 */
export function VersionBadge({
  version,
  versionToCompareWith,
}: VersionBadgeProps) {
  const comparison = compareVersions(version, versionToCompareWith);
  const meta = COMPARISON_META[comparison];
  const Icon = meta.icon;

  const truncated =
    version && version.length > MAX_DISPLAY_LENGTH
      ? `${version.slice(0, MAX_DISPLAY_LENGTH)}..`
      : version;

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!version) return;
    try {
      await navigator.clipboard.writeText(version);
      showInfoToast("Copied to clipboard", { duration: 2000 });
    } catch {
      showErrorToast("Failed to copy to clipboard");
    }
  };

  return (
    <Badge
      colorPalette="gray"
      variant="subtle"
      rounded="md"
      gap={2}
      pl={0.5}
      pr={2.5}
      py={0.5}
      title={version}
      position="relative"
      overflow="hidden"
      className="group"
    >
      <Center
        boxSize="20px"
        rounded="sm"
        bg={`${meta.palette}.500`}
        _dark={{ bg: `${meta.palette}.800` }}
        color="white"
        flexShrink={0}
      >
        <Icon size={11} strokeWidth={3} />
      </Center>
      <Box
        as="span"
        transition="margin-right 0.2s ease"
        _groupHover={version ? { mr: "22px" } : undefined}
      >
        {truncated ?? "—"}
      </Box>
      {!!version && (
        <IconButton
          aria-label="Copy to clipboard"
          title="Copy to clipboard"
          onClick={handleCopy}
          variant="plain"
          size="2xs"
          minW="auto"
          h="full"
          position="absolute"
          insetEnd={0}
          top={0}
          bottom={0}
          px={1.5}
          rounded="none"
          color="fg.muted"
          bg="colorPalette.subtle"
          opacity={0}
          transform="translateX(100%)"
          transition="opacity 0.2s ease, transform 0.2s ease"
          _groupHover={{ opacity: 1, transform: "translateX(0)" }}
          _hover={{ color: "fg" }}
        >
          <Copy size={12} />
        </IconButton>
      )}
    </Badge>
  );
}
