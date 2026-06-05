"use client";

import {
  Box,
  Button,
  Field,
  HStack,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

import { type SecretKey } from "~/lib/secrets";
import { setSecretSchema } from "~/lib/validation/secrets";
import { showErrorToast, showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

import { AppDialog } from "./dialog-utils";
import { useSecrets } from "./secrets-context";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Shown in place of a stored value, which is never sent back to the client.
const SET_PLACEHOLDER = "••••••••••••";

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

  const setSecret = api.secrets.set.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.secrets.list.invalidate();
      clearDraft(variables.key);
      showSuccessToast("Secret saved", {
        description: `${variables.key} has been stored securely.`,
      });
    },
    onError: (err) => {
      showErrorToast("Could not save secret", {
        description: "Failed to store the secret. Please try again.",
        details: err.message,
      });
    },
  });

  const removeSecret = api.secrets.remove.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.secrets.list.invalidate();
      clearDraft(variables.key);
      showSuccessToast("Secret removed", {
        description: `${variables.key} has been deleted.`,
      });
    },
    onError: (err) => {
      showErrorToast("Could not remove secret", {
        description: "Failed to delete the secret. Please try again.",
        details: err.message,
      });
    },
  });

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
          secrets.map((secret) => {
            const draft = drafts[secret.key];
            const isDirty = draft !== undefined && draft.length > 0;
            const savingThis =
              setSecret.isPending && setSecret.variables?.key === secret.key;
            const removingThis =
              removeSecret.isPending &&
              removeSecret.variables?.key === secret.key;

            return (
              <Box
                key={secret.key}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
              >
                <Stack gap={2}>
                  <Stack gap={0.5}>
                    <Text fontSize="sm" fontWeight="medium">
                      {secret.label}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {secret.description}
                    </Text>
                    {secret.helpUrl && (
                      <Link
                        href={secret.helpUrl}
                        target="_blank"
                        rel="noreferrer"
                        fontSize="xs"
                        colorPalette="blue"
                      >
                        How to create one
                      </Link>
                    )}
                  </Stack>

                  <Field.Root invalid={!!errors[secret.key]}>
                    <Input
                      type="password"
                      // Stop browsers / password managers from autofilling this
                      // field on open — an autofilled value would render as dots
                      // and falsely mark the row as edited.
                      autoComplete="new-password"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                      placeholder={secret.isSet ? SET_PLACEHOLDER : "Not set"}
                      value={draft ?? ""}
                      disabled={isBusy && !savingThis}
                      onChange={(e) => {
                        const val = e.currentTarget.value;
                        setDrafts((d) => ({ ...d, [secret.key]: val }));
                        if (errors[secret.key]) {
                          setErrors(({ [secret.key]: _omit, ...rest }) => rest);
                        }
                      }}
                    />
                    <Field.ErrorText>{errors[secret.key]}</Field.ErrorText>
                  </Field.Root>

                  {isDirty ? (
                    <HStack justify="end">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => clearDraft(secret.key)}
                        disabled={isBusy}
                      >
                        Cancel
                      </Button>
                      <Button
                        colorPalette="blue"
                        size="xs"
                        loading={savingThis}
                        onClick={() => handleSave(secret.key)}
                      >
                        Save
                      </Button>
                    </HStack>
                  ) : (
                    secret.isSet && (
                      <HStack justify="end">
                        <Button
                          variant="outline"
                          colorPalette="red"
                          size="xs"
                          loading={removingThis}
                          disabled={isBusy}
                          onClick={() =>
                            removeSecret.mutate({ key: secret.key })
                          }
                        >
                          Remove
                        </Button>
                      </HStack>
                    )
                  )}
                </Stack>
              </Box>
            );
          })
        )}
      </Stack>
    </AppDialog>
  );
}
