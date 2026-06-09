"use client";

import { Badge, Card, Heading, HStack, Stack, Text, Wrap } from "@chakra-ui/react";

import { IconLink } from "~/app/_components/icon-link";
import type { ResolvedService } from "~/lib/config/resolve";

/** Renders a label→url map as a wrap of icon links. */
function Links({ links }: { links: Record<string, string> }) {
  return (
    <Wrap gap={2}>
      {Object.entries(links).map(([label, url]) => (
        <IconLink key={label} name={label} url={url} />
      ))}
    </Wrap>
  );
}

/** A single resolved service rendered as a card with its links. */
export function ServiceCard({ service }: { service: ResolvedService }) {
  return (
    <Card.Root w="full" borderColor="border">
      <Card.Body py={3}>
        <HStack align="center" gap={4}>
          <Heading size="md" flex="0 0 50%">
            {service.name}
          </Heading>
          <Stack flex="1" gap={2}>
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
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
