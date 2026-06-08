"use client";

import {
  Badge,
  Card,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";

import type { ResolvedEnvironment } from "~/lib/config/resolve";

function LinkPill({ label, url }: { label: string; url: string }) {
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      display="inline-flex"
      alignItems="center"
      gap={1}
      fontSize="sm"
      px={2}
      py={1}
      borderWidth="1px"
      borderColor="border"
      rounded="md"
      _hover={{ bg: "bg.muted", textDecoration: "none" }}
    >
      {label}
      <ExternalLink size={12} aria-hidden />
    </Link>
  );
}

/** Renders a label→url map as a wrap of link pills. */
function Links({ links }: { links: Record<string, string> }) {
  return (
    <Wrap gap={2}>
      {Object.entries(links).map(([label, url]) => (
        <LinkPill key={label} label={label} url={url} />
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
            <Card.Root key={service.name} w="full" borderColor="border">
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
          ))}
        </Stack>
      )}
    </Stack>
  );
}
