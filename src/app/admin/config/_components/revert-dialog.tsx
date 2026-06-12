"use client";

import { Text } from "@chakra-ui/react";

import {
  AppDialog,
  DialogActions,
  useLastValue,
} from "~/app/_components/dialog-utils";
import { toastMutationOptions } from "~/lib/toast";
import { api } from "~/trpc/react";

export type RevertTarget = { version: number };

/** Confirms restoring a configuration version (saved as a new version). */
export function RevertDialog({
  target,
  onClose,
}: {
  target: RevertTarget | null;
  onClose: () => void;
}) {
  const display = useLastValue(target);
  const utils = api.useUtils();

  const revert = api.admin.config.revert.useMutation(
    toastMutationOptions({
      successTitle: "Configuration reverted",
      successDescription: (result: { version: number }) =>
        `Restored v${display?.version} as version ${result.version}.`,
      errorTitle: "Could not revert",
      errorDescription: "The configuration was not reverted. Please try again.",
      onDone: async () => {
        await Promise.all([
          utils.admin.config.getCurrent.invalidate(),
          utils.admin.config.history.invalidate(),
          utils.admin.config.getResolved.invalidate(),
        ]);
        onClose();
      },
    }),
  );

  return (
    <AppDialog
      open={!!target}
      onClose={onClose}
      title="Revert configuration"
      role="alertdialog"
      footer={
        <DialogActions
          onCancel={onClose}
          confirmLabel="Revert"
          confirmPalette="orange"
          loading={revert.isPending}
          onConfirm={() =>
            display && revert.mutate({ version: display.version })
          }
        />
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
