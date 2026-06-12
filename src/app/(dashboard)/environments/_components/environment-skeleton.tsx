"use client";

import { SimpleGrid, Skeleton, Stack } from "@chakra-ui/react";

/** Heading + service-card grid placeholder while the config loads. */
export function EnvironmentSkeleton() {
  return (
    <Stack gap={4}>
      <Skeleton h="8" maxW="sm" />
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} h="36" />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
