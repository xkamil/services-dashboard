"use client";

import {
  Box,
  Button,
  HStack,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

import { AppDialog, useLastValue } from "~/app/_components/dialog-utils";
import { SkeletonRows } from "~/app/_components/skeleton-rows";
import { formatDateTime } from "~/lib/format";
import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

import { ConfigDiffDialog } from "./config-diff-dialog";

type RevertTarget = { version: number };

function RevertDialog({
  target,
  onClose,
}: {
  target: RevertTarget | null;
  onClose: () => void;
}) {
  const display = useLastValue(target);
  const utils = api.useUtils();

  const revert = api.admin.config.revert.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.admin.config.getCurrent.invalidate(),
        utils.admin.config.history.invalidate(),
        utils.admin.config.getResolved.invalidate(),
      ]);
      onClose();
      showSuccessToast("Configuration reverted", {
        description: `Restored v${display?.version} as version ${result.version}.`,
      });
    },
    onError: (error) => {
      showErrorToast("Could not revert", {
        description: "The configuration was not reverted. Please try again.",
        details: error.message,
      });
    },
  });

  return (
    <AppDialog
      open={!!target}
      onClose={onClose}
      title="Revert configuration"
      role="alertdialog"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorPalette="orange"
            loading={revert.isPending}
            onClick={() => display && revert.mutate({ version: display.version })}
          >
            Revert
          </Button>
        </>
      }
    >
      <Text fontSize="sm" color="fg.muted">
        This restores the configuration from version{" "}
        <Text as="span" color="fg" fontWeight="medium">
          v{display?.version}
        </Text>{" "}
        by saving it as a new version. Nothing is deleted.
      </Text>
    </AppDialog>
  );
}

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
        <Box borderWidth="1px" borderColor="border" rounded="md" overflowX="auto">
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Version</Table.ColumnHeader>
                <Table.ColumnHeader>When</Table.ColumnHeader>
                <Table.ColumnHeader>Author</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {!versions || versions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <Text textAlign="center" color="fg.muted" py={4}>
                      No versions yet.
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                versions.map((v) => {
                  const isOldest = v.version === 1;
                  const isCurrent = v.version === versions[0]?.version;
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
                            onClick={() =>
                              setRevertTarget({ version: v.version })
                            }
                          >
                            Revert
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <ConfigDiffDialog target={diffTarget} onClose={() => setDiffTarget(null)} />
      <RevertDialog
        target={revertTarget}
        onClose={() => setRevertTarget(null)}
      />
    </Stack>
  );
}
