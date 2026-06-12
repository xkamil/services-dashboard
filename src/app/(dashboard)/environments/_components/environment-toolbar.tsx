"use client";

import { HStack, NativeSelect } from "@chakra-ui/react";

import { ClearFiltersButton } from "~/app/_components/clear-filters-button";
import { RefreshButton } from "~/app/_components/refresh-button";
import { SearchInput } from "~/app/_components/search-input";
import type { Comparison } from "~/lib/version";

import type { VersionFilterValue } from "./version-filter";
import { VersionFilter } from "./version-filter";

/** Name / owner / version-status filters plus refresh for a service list. */
export function EnvironmentToolbar({
  nameFilter,
  onNameFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  versionFilter,
  onVersionFilterChange,
  owners,
  versionCounts,
  activeFilterCount,
  onClearAll,
  refreshing,
  onRefresh,
}: {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  versionFilter: VersionFilterValue;
  onVersionFilterChange: (value: VersionFilterValue) => void;
  /** Each owner with the number of services they own. */
  owners: { owner: string; count: number }[];
  versionCounts: Record<Comparison, number>;
  activeFilterCount: number;
  onClearAll: () => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <HStack gap={3} align="center" w="full">
      <HStack
        gap={3}
        align="center"
        w="full"
        maxW={{ base: "full", md: "2xl" }}
      >
        <SearchInput
          flex="1"
          size="md"
          value={nameFilter}
          onChange={onNameFilterChange}
          placeholder="filter by name..."
        />
        <NativeSelect.Root flex="1" size="md">
          <NativeSelect.Field
            placeholder="filter by owner..."
            value={ownerFilter}
            onChange={(e) => onOwnerFilterChange(e.currentTarget.value)}
            color={ownerFilter === "" ? "fg.muted" : undefined}
          >
            {owners.map(({ owner, count }) => (
              <option key={owner} value={owner}>
                {owner} ({count})
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <VersionFilter
          value={versionFilter}
          onChange={onVersionFilterChange}
          counts={versionCounts}
        />
        <ClearFiltersButton
          size="md"
          activeFilterCount={activeFilterCount}
          onClear={onClearAll}
        />
      </HStack>
      <RefreshButton
        size="md"
        flex="none"
        ms="auto"
        loading={refreshing}
        onRefresh={onRefresh}
      />
    </HStack>
  );
}
