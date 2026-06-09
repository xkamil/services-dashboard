"use client";

import { HStack, NativeSelect, Stack, Text, Wrap } from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { IconLink } from "~/app/_components/icon-link";
import { SearchInput } from "~/app/_components/search-input";
import type { ResolvedEnvironment } from "~/lib/config/resolve";

import { ServiceCard } from "./service-card";

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

  const filteredServices = useMemo(() => {
    const query = nameFilter.trim().toLowerCase();
    return env.services.filter(
      (service) =>
        (query === "" || service.name.toLowerCase().includes(query)) &&
        (ownerFilter === "" || service.owner === ownerFilter),
    );
  }, [env.services, nameFilter, ownerFilter]);

  return (
    <Stack gap={6}>
      {Object.keys(env.links).length > 0 && <Links links={env.links} />}

      {env.services.length === 0 ? (
        <Text color="fg.muted">No services configured for this environment.</Text>
      ) : (
        <Stack gap={3}>
          <HStack
            gap={3}
            align="center"
            w="full"
            maxW={{ base: "full", md: "md", xl: "sm" }}
          >
            <SearchInput
              flex="1"
              value={nameFilter}
              onChange={setNameFilter}
              placeholder="filter by name..."
            />
            <NativeSelect.Root flex="1">
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
          </HStack>

          {filteredServices.length === 0 ? (
            <Text color="fg.muted">No services match the current filters.</Text>
          ) : (
            <Stack gap={2}>
              {filteredServices.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
