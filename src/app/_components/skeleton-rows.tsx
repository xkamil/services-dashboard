"use client";

import { Skeleton, Stack } from "@chakra-ui/react";

/** Stacked skeleton rows shown while a table or list loads. */
export function SkeletonRows({
  count = 4,
  h = "10",
}: {
  count?: number;
  h?: string;
}) {
  return (
    <Stack gap={2}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} h={h} />
      ))}
    </Stack>
  );
}
