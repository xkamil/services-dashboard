"use client";

import { Badge, Card, Heading, HStack, Stack, Text, Wrap } from "@chakra-ui/react";

import { IconLink } from "~/app/_components/icon-link";
import type { ResolvedService } from "~/lib/config/resolve";

import { VersionBadge } from "./version-badge";

/** Renders a label→url map as a wrap of icon links. */
function Links({ links }: { links: Record<string, string> }) {
  return (
    <Wrap gap={4}>
      {Object.entries(links).map(([label, url]) => (
        <IconLink key={label} name={label} url={url} />
      ))}
    </Wrap>
  );
}

// TODO: temporary sample versions for testing VersionBadge — replace with real
// data once versions are wired into ResolvedService. Deterministic by service
// name so each card stays stable across renders (no hydration mismatch).
const SAMPLE_VERSIONS: Array<[string?, string?]> = [
  ["1.4.2", "1.4.0"], // greater → up / green
  ["2.0.0", "2.0.0"], // equal → equal / blue
  ["1.2.3", "1.3.0"], // less → down / red
  [undefined, "1.0.0"], // unknown → ? / gray
  ["1.2.3-feat-some-new-feature", "1.2.3"], // suffixed → greater + truncated
];

function sampleVersions(seed: string): [string?, string?] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SAMPLE_VERSIONS[hash % SAMPLE_VERSIONS.length]!;
}

/** A single resolved service rendered as a card with its links. */
export function ServiceCard({ service }: { service: ResolvedService }) {
  const [version, versionToCompareWith] = sampleVersions(service.name);
  return (
    <Card.Root
      w="full"
      borderColor="border"
      transition="background 0.15s"
      _hover={{ bg: "bg.muted" }}
    >
      <Card.Body py={3}>
        <HStack align="center" gap={2}>
          <HStack flex="1" minW="0">
            <Heading
              size="md"
              fontWeight="normal"
              _dark={{ color: "fg.muted" }}
            >
              {service.name}
            </Heading>
          </HStack>

          <HStack flex="1" minW="0">
            <VersionBadge
              version={version}
              versionToCompareWith={versionToCompareWith}
            />
          </HStack>

          <Stack flex="1" minW="0" gap={2}>
            <Links links={service.links} />
            {service.unresolved.length > 0 && (
              <HStack gap={1} wrap="wrap">
                <Text fontSize="xs" color="fg.muted">
                  Unresolved:
                </Text>
                {service.unresolved.map((name) => (
                  <Badge key={name} colorPalette="yellow" size="sm">
                    ${`{${name}}`}
                  </Badge>
                ))}
              </HStack>
            )}
          </Stack>

          <HStack flex="1" minW="0" gap={1} justify="flex-end">
            <Text fontSize="xs" color="fg.muted">
              Owner:
            </Text>
            <Text
              fontSize="xs"
              w="80px"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              title={service.owner}
            >
              {service.owner}
            </Text>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
