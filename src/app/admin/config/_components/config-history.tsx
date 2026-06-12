"use client";

import { Button, HStack, Stack, Table, Text } from "@chakra-ui/react";
import { useState } from "react";

import { DataTable } from "~/app/_components/data-table";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { api } from "~/trpc/react";

import { ConfigDiffDialog } from "./config-diff-dialog";
import { RevertDialog, type RevertTarget } from "./revert-dialog";

export function ConfigHistory() {
  const { data: versions, isLoading } = api.admin.config.history.useQuery();
  const [diffTarget, setDiffTarget] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const [revertTarget, setRevertTarget] = useState<RevertTarget | null>(null);

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Every saved version, newest first. Diff a version against the one before
        it, or restore it.
      </Text>

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <DataTable
          columnCount={5}
          isEmpty={!versions || versions.length === 0}
          emptyMessage="No versions yet."
          header={
            <>
              <Table.ColumnHeader>Version</Table.ColumnHeader>
              <Table.ColumnHeader>When</Table.ColumnHeader>
              <Table.ColumnHeader>Author</Table.ColumnHeader>
              <Table.ColumnHeader>Description</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
            </>
          }
        >
          {(versions ?? []).map((v) => {
            const isOldest = v.version === 1;
            const isCurrent = v.version === versions?.[0]?.version;
            return (
              <Table.Row key={v.version}>
                <Table.Cell fontWeight="medium" whiteSpace="nowrap">
                  v{v.version}
                  {isCurrent && (
                    <Text as="span" color="fg.muted" fontSize="xs" ml={2}>
                      current
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell whiteSpace="nowrap">
                  {formatDateTime(v.createdAt)}
                </Table.Cell>
                <Table.Cell>{v.authorEmail ?? "—"}</Table.Cell>
                <Table.Cell color="fg.muted">{v.message ?? "—"}</Table.Cell>
                <Table.Cell textAlign="end">
                  <HStack gap={2} justify="end">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={isOldest}
                      onClick={() =>
                        setDiffTarget({
                          from: v.version - 1,
                          to: v.version,
                        })
                      }
                    >
                      Diff
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={isCurrent}
                      onClick={() => setRevertTarget({ version: v.version })}
                    >
                      Revert
                    </Button>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </DataTable>
      )}

      <ConfigDiffDialog target={diffTarget} onClose={() => setDiffTarget(null)} />
      <RevertDialog
        target={revertTarget}
        onClose={() => setRevertTarget(null)}
      />
    </Stack>
  );
}
