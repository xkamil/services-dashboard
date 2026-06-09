"use client";

import { Stack, Text, Wrap } from "@chakra-ui/react";

import { IconLink } from "~/app/_components/icon-link";
import type { ResolvedEnvironment } from "~/lib/config/resolve";

import { ServiceCard } from "./service-card";

/** Renders a label→url map as a wrap of icon links. */
function Links({ links }: { links: Record<string, string> }) {
  return (
    <Wrap gap={2}>
      {Object.entries(links).map(([label, url]) => (
        <IconLink key={label} name={label} url={url} showLabel/>
      ))}
    </Wrap>
  );
}

export function EnvironmentPanel({ env }: { env: ResolvedEnvironment }) {
  return (
    <Stack gap={6}>
      {Object.keys(env.links).length > 0 && <Links links={env.links} />}

      {env.services.length === 0 ? (
        <Text color="fg.muted">No services configured for this environment.</Text>
      ) : (
        <Stack gap={3}>
          {env.services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
