"use client";

import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { api, type RouterOutputs } from "~/trpc/react";

import { ConfigDiffDialog } from "./config-diff-dialog";
import { RevertDialog, type RevertTarget } from "./revert-dialog";

type VersionRow = RouterOutputs["admin"]["config"]["history"][number];

const columnHelper = createColumnHelper<VersionRow>();

export function ConfigHistory() {
  const { data: versions, isLoading } = api.admin.config.history.useQuery();
  const [diffTarget, setDiffTarget] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [revertTarget, setRevertTarget] = useState<RevertTarget | null>(null);

  const currentVersion = versions?.[0]?.version;

  const columns = useMemo(
    () => [
      columnHelper.accessor("version", {
        header: "Version",
        meta: { cellProps: { fontWeight: "medium", whiteSpace: "nowrap" } },
        cell: ({ getValue }) => (
          <>
            v{getValue()}
            {getValue() === currentVersion && (
              <Text as="span" color="fg.muted" fontSize="xs" ml={2}>
                current
              </Text>
            )}
          </>
        ),
      }),
      columnHelper.accessor("createdAt", {
        header: "When",
        cell: ({ getValue }) => formatDateTime(getValue()),
        meta: { cellProps: { whiteSpace: "nowrap" } },
      }),
      columnHelper.accessor("authorEmail", {
        header: "Author",
        cell: ({ getValue }) => getValue() ?? "—",
      }),
      columnHelper.accessor("message", {
        header: "Description",
        cell: ({ getValue }) => getValue() ?? "—",
        meta: { cellProps: { color: "fg.muted" } },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        meta: {
          headerProps: { textAlign: "end" },
          cellProps: { textAlign: "end" },
        },
        cell: ({ row }) => {
          const v = row.original;
          return (
            <HStack gap={2} justify="end">
              <Button
                size="xs"
                variant="outline"
                disabled={v.version === 1}
                onClick={() =>
                  setDiffTarget({ from: v.version - 1, to: v.version })
                }
              >
                Diff
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={v.version === currentVersion}
                onClick={() => setRevertTarget({ version: v.version })}
              >
                Revert
              </Button>
            </HStack>
          );
        },
      }),
    ],
    [currentVersion],
  );

  const data = useMemo(() => versions ?? [], [versions]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (v) => String(v.version),
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Every saved version, newest first. Diff a version against the one before
        it, or restore it.
      </Text>

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <DataTable table={table} emptyMessage="No versions yet." />
      )}

      <ConfigDiffDialog target={diffTarget} onClose={() => setDiffTarget(null)} />
      <RevertDialog
        target={revertTarget}
        onClose={() => setRevertTarget(null)}
      />
    </Stack>
  );
}
