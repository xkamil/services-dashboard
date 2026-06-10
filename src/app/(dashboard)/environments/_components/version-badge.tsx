"use client";

import { Badge, Box, Center, IconButton, Spinner } from "@chakra-ui/react";
import { Copy } from "lucide-react";

import { showErrorToast, showInfoToast } from "~/lib/toast";
import { compareVersions } from "~/lib/version";

import { ComparisonIcon } from "./version-comparison";

export interface VersionBadgeProps {
  /** The version this badge represents (semantic versioning, e.g. `1.4.2`). */
  version?: string;
  /** The version to compare `version` against, driving the indicator. */
  versionToCompareWith?: string;
  /** While true the version is being fetched: shows a spinner and "loading..". */
  loading?: boolean;
}

/** Max characters of the version shown in the badge before it is truncated. */
const MAX_DISPLAY_LENGTH = 20;

/**
 * A rounded badge showing a service `version`, prefixed by a small indicator
 * that reflects how it compares to `versionToCompareWith`:
 * up/green when greater, equal/blue when equal, down/red when lower, and a
 * gray `?` when either version is missing.
 */
export function VersionBadge({
  version,
  versionToCompareWith,
  loading,
}: VersionBadgeProps) {
  const comparison = compareVersions(version, versionToCompareWith);

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
      {loading ? (
        <Center boxSize="20px" rounded="sm" flexShrink={0}>
          <Spinner size="xs" />
        </Center>
      ) : (
        <ComparisonIcon comparison={comparison} />
      )}
      <Box
        as="span"
        transition="margin-right 0.2s ease"
        _groupHover={!loading && version ? { mr: "22px" } : undefined}
      >
        {loading ? "loading.." : (truncated ?? "—")}
      </Box>
      {!loading && !!version && (
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
