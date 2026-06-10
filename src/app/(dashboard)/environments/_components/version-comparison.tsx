"use client";

import { Center } from "@chakra-ui/react";
import { ArrowDown, ArrowUp, Equal, HelpCircle } from "lucide-react";

import type { Comparison } from "~/lib/version";

/**
 * Display metadata for each {@link Comparison} bucket: the indicator `icon`, its
 * color `palette`, a short `label`, and a `description` for the filter dropdown.
 * Shared by {@link VersionBadge} and the version filter so both stay in sync.
 */
export const COMPARISON_META = {
  greater: {
    icon: ArrowUp,
    palette: "green",
    label: "Newer",
    description: "Ahead of the reference version",
  },
  equal: {
    icon: Equal,
    palette: "blue",
    label: "Same",
    description: "Matches the reference version",
  },
  less: {
    icon: ArrowDown,
    palette: "red",
    label: "Older",
    description: "Behind the reference version",
  },
  unknown: {
    icon: HelpCircle,
    palette: "gray",
    label: "Unknown",
    description: "Missing or not comparable",
  },
} as const satisfies Record<
  Comparison,
  { icon: typeof ArrowUp; palette: string; label: string; description: string }
>;

/** The comparison categories, in display order. */
export const COMPARISONS = ["greater", "equal", "less", "unknown"] as const;

/** The small colored rounded swatch with the comparison indicator icon. */
export function ComparisonIcon({ comparison }: { comparison: Comparison }) {
  const { icon: Icon, palette } = COMPARISON_META[comparison];
  return (
    <Center
      boxSize="20px"
      rounded="sm"
      bg={`${palette}.500`}
      _dark={{ bg: `${palette}.800` }}
      color="white"
      flexShrink={0}
    >
      <Icon size={11} strokeWidth={3} />
    </Center>
  );
}
