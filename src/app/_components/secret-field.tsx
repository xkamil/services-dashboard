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

import type { SecretStatus } from "./secrets-context";

// Shown in place of a stored value, which is never sent back to the client.
const SET_PLACEHOLDER = "••••••••••••";

/**
 * One secret in the secrets dialog: label, description, masked input and the
 * Save / Cancel / Remove actions. All state lives in the parent dialog.
 */
export function SecretField({
  secret,
  draft,
  error,
  isBusy,
  saving,
  removing,
  onDraftChange,
  onCancel,
  onSave,
  onRemove,
}: {
  secret: SecretStatus;
  draft: string | undefined;
  error: string | undefined;
  /** Any secret mutation is in flight — disables inputs of other rows. */
  isBusy: boolean;
  saving: boolean;
  removing: boolean;
  onDraftChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const isDirty = draft !== undefined && draft.length > 0;

  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" p={3}>
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

        <Field.Root invalid={!!error}>
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
            disabled={isBusy && !saving}
            onChange={(e) => onDraftChange(e.currentTarget.value)}
          />
          <Field.ErrorText>{error}</Field.ErrorText>
        </Field.Root>

        {isDirty ? (
          <HStack justify="end">
            <Button
              variant="ghost"
              size="xs"
              onClick={onCancel}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              size="xs"
              loading={saving}
              onClick={onSave}
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
                loading={removing}
                disabled={isBusy}
                onClick={onRemove}
              >
                Remove
              </Button>
            </HStack>
          )
        )}
      </Stack>
    </Box>
  );
}
