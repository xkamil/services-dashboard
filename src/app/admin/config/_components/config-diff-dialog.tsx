"use client";

import {
  Badge,
  Box,
  Button,
  Code,
  Stack,
  Text,
} from "@chakra-ui/react";

import type { ConfigChange } from "~/lib/config/diff";
import { api } from "~/trpc/react";

import { AppDialog, useLastValue } from "~/app/_components/dialog-utils";
import { SkeletonRows } from "~/app/_components/skeleton-rows";

type DiffTarget = { from: number; to: number };

type Props = {
  target: DiffTarget | null;
  onClose: () => void;
};

const TYPE_META: Record<ConfigChange["type"], { label: string; palette: string }> =
  {
    CREATE: { label: "Added", palette: "green" },
    REMOVE: { label: "Removed", palette: "red" },
    CHANGE: { label: "Changed", palette: "yellow" },
  };

function renderValue(value: unknown): string {
  if (value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function ConfigDiffDialog({ target, onClose }: Props) {
  const display = useLastValue(target);

  const { data: changes, isLoading } = api.admin.config.diff.useQuery(
    display ?? { from: 0, to: 0 },
    { enabled: !!target },
  );

  return (
    <AppDialog
      open={!!target}
      onClose={onClose}
      title={
        display ? `Changes from v${display.from} to v${display.to}` : "Changes"
      }
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {isLoading ? (
        <SkeletonRows count={3} h="8" />
      ) : !changes || changes.length === 0 ? (
        <Text color="fg.muted">No differences between these versions.</Text>
      ) : (
        <Stack gap={3}>
          {changes.map((change, i) => {
            const meta = TYPE_META[change.type];
            return (
              <Box
                key={i}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
              >
                <Stack gap={1}>
                  <Box>
                    <Badge colorPalette={meta.palette} mr={2}>
                      {meta.label}
                    </Badge>
                    <Code fontSize="xs">{change.path}</Code>
                  </Box>
                  {change.type !== "CREATE" && (
                    <Text fontSize="xs" color="red.fg" wordBreak="break-all">
                      − {renderValue(change.oldValue)}
                    </Text>
                  )}
                  {change.type !== "REMOVE" && (
                    <Text fontSize="xs" color="green.fg" wordBreak="break-all">
                      + {renderValue(change.newValue)}
                    </Text>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </AppDialog>
  );
}
