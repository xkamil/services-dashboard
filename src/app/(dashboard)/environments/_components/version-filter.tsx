"use client";

import {
  createListCollection,
  HStack,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";

import type { Comparison } from "~/lib/version";

import { ComparisonIcon, COMPARISON_META, COMPARISONS } from "./version-comparison";

/** Selected version filter: a comparison category, or `""` for "all". */
export type VersionFilterValue = Comparison | "";

interface VersionFilterItem {
  value: VersionFilterValue;
  label: string;
  description?: string;
}

interface VersionFilterProps {
  value: VersionFilterValue;
  onChange: (value: VersionFilterValue) => void;
  /** Number of services in each comparison category, for the option labels. */
  counts: Record<Comparison, number>;
}

/**
 * Dropdown that filters services by how their version compares to its
 * reference (newer / same / older / unknown). Uses Chakra's composable
 * `Select` rather than `NativeSelect` so each option can show the same colored
 * indicator icon as the badge — native `<option>`s cannot render icons.
 */
export function VersionFilter({ value, onChange, counts }: VersionFilterProps) {
  const collection = useMemo(() => {
    const items: VersionFilterItem[] = [
      { value: "", label: "filter by version..." },
      ...COMPARISONS.map((comparison) => ({
        value: comparison,
        label: `${COMPARISON_META[comparison].label} (${counts[comparison]})`,
        description: COMPARISON_META[comparison].description,
      })),
    ];
    return createListCollection({ items });
  }, [counts]);

  return (
    <Select.Root
      flex="1"
      size="md"
      collection={collection}
      value={[value]}
      onValueChange={(e) => onChange((e.value[0] ?? "") as VersionFilterValue)}
      positioning={{ sameWidth: false }}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          {value === "" ? (
            <Text color="fg.muted">filter by version...</Text>
          ) : (
            <HStack gap={2}>
              <ComparisonIcon comparison={value} />
              <Text>{COMPARISON_META[value].label}</Text>
            </HStack>
          )}
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content minW="3xs">
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <HStack gap={2}>
                  {item.value !== "" && (
                    <ComparisonIcon comparison={item.value} />
                  )}
                  <Stack gap={0}>
                    <Text>{item.label}</Text>
                    {item.description && (
                      <Text fontSize="xs" color="fg.muted">
                        {item.description}
                      </Text>
                    )}
                  </Stack>
                </HStack>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
