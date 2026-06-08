"use client";

import { SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";

import { environmentSlug } from "~/lib/config/resolve";
import { api } from "~/trpc/react";

import { EnvironmentPanel } from "./environment-panel";

/** Renders the panel for the environment whose slug matches `slug`. */
export function EnvironmentDetail({ slug }: { slug: string }) {
  const { data, isLoading } = api.admin.config.getResolved.useQuery({});

  if (isLoading) {
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

  const env = data?.environments.find((e) => environmentSlug(e.name) === slug);

  if (!env) {
    return <Text color="fg.muted">Environment not found.</Text>;
  }

  return <EnvironmentPanel env={env} />;
}
