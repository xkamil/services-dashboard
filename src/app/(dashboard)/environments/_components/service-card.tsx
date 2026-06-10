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

/** A single resolved service rendered as a card with its links. */
export function ServiceCard({
  service,
  version,
  versionToCompareWith,
  versionLoading,
}: {
  service: ResolvedService;
  /** Deployed version of this service, fetched by the parent panel. */
  version?: string;
  /** Reference version the badge compares `version` against. */
  versionToCompareWith?: string;
  /** While true the version is still being fetched. */
  versionLoading?: boolean;
}) {
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
              loading={versionLoading}
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
