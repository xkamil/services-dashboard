"use client";

import { HStack, NativeSelect, Stack, Text, Wrap } from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { ClearFiltersButton } from "~/app/_components/clear-filters-button";
import { IconLink } from "~/app/_components/icon-link";
import { RefreshButton } from "~/app/_components/refresh-button";
import { SearchInput } from "~/app/_components/search-input";
import type { ResolvedEnvironment } from "~/lib/config/resolve";
import { type Comparison, compareVersions } from "~/lib/version";
import { api } from "~/trpc/react";

import { ServiceCard } from "./service-card";
import { VersionFilter, type VersionFilterValue } from "./version-filter";

/** Renders a label→url map as a wrap of icon links, separated below by a line. */
function Links({ links }: { links: Record<string, string> }) {
  return (
    <Wrap
      gap={4}
      mt={-4}
      pb={4}
      borderBottomWidth="1px"
      borderColor="border.emphasized"
    >
      {Object.entries(links).map(([label, url]) => (
        <IconLink key={label} name={label} url={url} showLabel/>
      ))}
    </Wrap>
  );
}

export function EnvironmentPanel({ env }: { env: ResolvedEnvironment }) {
  const [nameFilter, setNameFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [versionFilter, setVersionFilter] = useState<VersionFilterValue>("");

  const utils = api.useUtils();

  // Versions are fetched per service per environment; httpBatchLink collapses
  // these into a single request, and each query is cached by env+service name.
  const versionQueries = api.useQueries((t) =>
    env.services.map((service) =>
      t.version.getForService({
        envName: env.name,
        serviceName: service.name,
      }),
    ),
  );

  const versionData = env.services.map((service, i) => ({
    name: service.name,
    version: versionQueries[i]?.data?.version,
    versionToCompareWith: versionQueries[i]?.data?.versionToCompareWith,
  }));
  const versionKey = JSON.stringify(versionData);

  // Per-service fetch state (covers both the initial load and refreshes) plus a
  // single flag for the refresh button's spinner.
  const versionLoadingByService = new Map<string, boolean>();
  env.services.forEach((service, i) => {
    versionLoadingByService.set(service.name, versionQueries[i]?.isFetching ?? false);
  });
  const anyVersionFetching = versionQueries.some((q) => q.isFetching);

  // Comparison category, fetched versions, and per-category counts for every
  // service. `versionData` is rebuilt each render, so memoize on `versionKey`
  // (its serialized contents) rather than the unstable array reference.
  const { comparisonByService, versionByService, versionCounts } = useMemo(() => {
    const comparisonByService = new Map<string, Comparison>();
    const versionByService = new Map<
      string,
      { version?: string; versionToCompareWith?: string }
    >();
    const versionCounts: Record<Comparison, number> = {
      greater: 0,
      equal: 0,
      less: 0,
      unknown: 0,
    };
    for (const { name, version, versionToCompareWith } of versionData) {
      const comparison = compareVersions(version, versionToCompareWith);
      comparisonByService.set(name, comparison);
      versionByService.set(name, { version, versionToCompareWith });
      versionCounts[comparison] += 1;
    }
    return { comparisonByService, versionByService, versionCounts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionKey]);

  // Each owner with the number of services they own, sorted by owner name.
  const owners = useMemo(() => {
    const counts = new Map<string, number>();
    for (const service of env.services) {
      counts.set(service.owner, (counts.get(service.owner) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([owner, count]) => ({ owner, count }))
      .sort((a, b) => a.owner.localeCompare(b.owner));
  }, [env.services]);

  // Count of filters that currently narrow the list, for the clear-all badge.
  const activeFilterCount =
    (nameFilter.trim() === "" ? 0 : 1) +
    (ownerFilter === "" ? 0 : 1) +
    (versionFilter === "" ? 0 : 1);

  const clearAllFilters = () => {
    setNameFilter("");
    setOwnerFilter("");
    setVersionFilter("");
  };

  const filteredServices = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return env.services.filter(
      (service) =>
        (query === "" || service.name.toLowerCase().includes(query)) &&
        (ownerFilter === "" || service.owner === ownerFilter) &&
        (versionFilter === "" ||
          comparisonByService.get(service.name) === versionFilter),
    );
  }, [env.services, nameFilter, ownerFilter, versionFilter, comparisonByService]);

  return (
    <Stack gap={6}>
      {Object.keys(env.links).length > 0 && <Links links={env.links} />}

      {env.services.length === 0 ? (
        <Text color="fg.muted">No services configured for this environment.</Text>
      ) : (
        <Stack gap={3}>
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
                onChange={setNameFilter}
                placeholder="filter by name..."
              />
              <NativeSelect.Root flex="1" size="md">
                <NativeSelect.Field
                  placeholder="filter by owner..."
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.currentTarget.value)}
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
                onChange={setVersionFilter}
                counts={versionCounts}
              />
              <ClearFiltersButton
                size="md"
                activeFilterCount={activeFilterCount}
                onClear={clearAllFilters}
              />
            </HStack>
            <RefreshButton
              size="md"
              flex="none"
              ms="auto"
              variant="ghost"
              loading={anyVersionFetching}
              onRefresh={() => void utils.version.getForService.invalidate()}
            />
          </HStack>

          {filteredServices.length === 0 ? (
            <Text color="fg.muted">No services match the current filters.</Text>
          ) : (
            <Stack gap={2}>
              {filteredServices.map((service) => {
                const v = versionByService.get(service.name);
                return (
                  <ServiceCard
                    key={service.name}
                    service={service}
                    version={v?.version}
                    versionToCompareWith={v?.versionToCompareWith}
                    versionLoading={versionLoadingByService.get(service.name)}
                  />
                );
              })}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
