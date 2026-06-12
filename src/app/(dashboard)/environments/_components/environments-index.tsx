"use client";

import { Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { environmentSlug } from "~/lib/config/resolve";
import { api } from "~/trpc/react";

import { EnvironmentSkeleton } from "./environment-skeleton";

/**
 * `/environments` has no content of its own — it forwards to the first
 * configured environment's page so a tab is always selected.
 */
export function EnvironmentsIndex() {
  const router = useRouter();
  const { data, isLoading } = api.admin.config.getResolved.useQuery({});

  const first = data?.environments[0];

  useEffect(() => {
    if (first) {
      router.replace(`/environments/${environmentSlug(first.name)}`);
    }
  }, [first, router]);

  if (!isLoading && !first) {
    return <Text color="fg.muted">No environments configured yet.</Text>;
  }

  return <EnvironmentSkeleton />;
}
