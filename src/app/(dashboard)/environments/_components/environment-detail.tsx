"use client";

import { Text } from "@chakra-ui/react";

import { environmentSlug } from "~/lib/config/resolve";
import { api } from "~/trpc/react";

import { EnvironmentPanel } from "./environment-panel";
import { EnvironmentSkeleton } from "./environment-skeleton";

/** Renders the panel for the environment whose slug matches `slug`. */
export function EnvironmentDetail({ slug }: { slug: string }) {
  const { data, isLoading } = api.admin.config.getResolved.useQuery({});

  if (isLoading) {
    return <EnvironmentSkeleton />;
  }

  const env = data?.environments.find((e) => environmentSlug(e.name) === slug);

  if (!env) {
    return <Text color="fg.muted">Environment not found.</Text>;
  }

  return <EnvironmentPanel env={env} />;
}
