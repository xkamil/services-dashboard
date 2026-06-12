"use client";

import { Button, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";

import { type SecretKey } from "~/lib/secrets";
import { setSecretSchema } from "~/lib/validation/secrets";
import { toastMutationOptions } from "~/lib/toast";
import { api } from "~/trpc/react";

import { AppDialog } from "./dialog-utils";
import { SecretField } from "./secret-field";
import { useSecrets } from "./secrets-context";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Lets the signed-in user set, update, and remove their own secrets. Stored
 * values are never sent back to the client — a set secret shows only a masked
 * placeholder. Typing a new value reveals Save / Cancel.
 */
export function SecretsDialog({ open, onClose }: Props) {
  const { secrets, isLoading } = useSecrets();
  // Per-secret draft input; a key is present only while the user is editing it.
  const [drafts, setDrafts] = useState<Partial<Record<SecretKey, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<SecretKey, string>>>({});

  const utils = api.useUtils();

  const clearDraft = (key: SecretKey) => {
    setDrafts(({ [key]: _omit, ...rest }) => rest);
    setErrors(({ [key]: _omit, ...rest }) => rest);
  };

  const resetEditor = () => {
    setDrafts({});
    setErrors({});
  };

  const setSecret = api.secrets.set.useMutation(
    toastMutationOptions({
      successTitle: "Secret saved",
      successDescription: (_data, variables: { key: SecretKey }) =>
        `${variables.key} has been stored securely.`,
      errorTitle: "Could not save secret",
      errorDescription: "Failed to store the secret. Please try again.",
      onDone: async (_data, variables) => {
        await utils.secrets.list.invalidate();
        clearDraft(variables.key);
      },
    }),
  );

  const removeSecret = api.secrets.remove.useMutation(
    toastMutationOptions({
      successTitle: "Secret removed",
      successDescription: (_data, variables: { key: SecretKey }) =>
        `${variables.key} has been deleted.`,
      errorTitle: "Could not remove secret",
      errorDescription: "Failed to delete the secret. Please try again.",
      onDone: async (_data, variables) => {
        await utils.secrets.list.invalidate();
        clearDraft(variables.key);
      },
    }),
  );

  const isBusy = setSecret.isPending || removeSecret.isPending;

  const handleSave = (key: SecretKey) => {
    const parsed = setSecretSchema.safeParse({ key, value: drafts[key] ?? "" });
    if (!parsed.success) {
      setErrors((e) => ({
        ...e,
        [key]: parsed.error.issues[0]?.message ?? "Invalid value",
      }));
      return;
    }
    setSecret.mutate(parsed.data);
  };

  return (
    <AppDialog
      open={open}
      onClose={() => {
        resetEditor();
        onClose();
      }}
      title="Secrets"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <Stack gap={4}>
        <Text fontSize="sm" color="fg.muted">
          Secrets are encrypted and used only by the backend to call external
          services. Their values are never shown again after you save them.
        </Text>

        {isLoading ? (
          <Text fontSize="sm" color="fg.muted">
            Loading…
          </Text>
        ) : (
          secrets.map((secret) => (
            <SecretField
              key={secret.key}
              secret={secret}
              draft={drafts[secret.key]}
              error={errors[secret.key]}
              isBusy={isBusy}
              saving={
                setSecret.isPending && setSecret.variables?.key === secret.key
              }
              removing={
                removeSecret.isPending &&
                removeSecret.variables?.key === secret.key
              }
              onDraftChange={(val) => {
                setDrafts((d) => ({ ...d, [secret.key]: val }));
                if (errors[secret.key]) {
                  setErrors(({ [secret.key]: _omit, ...rest }) => rest);
                }
              }}
              onCancel={() => clearDraft(secret.key)}
              onSave={() => handleSave(secret.key)}
              onRemove={() => removeSecret.mutate({ key: secret.key })}
            />
          ))
        )}
      </Stack>
    </AppDialog>
  );
}
