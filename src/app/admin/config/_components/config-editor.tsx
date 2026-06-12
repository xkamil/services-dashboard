"use client";

import {
  Alert,
  Box,
  Button,
  Field,
  HStack,
  Input,
  List,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { appConfigSchema } from "~/lib/config/schema";
import { toastMutationOptions } from "~/lib/toast";
import { api } from "~/trpc/react";

// Monaco bundles a heavy editor that only runs in the browser, so load it
// client-side only. NOTE: Monaco is not a Chakra component (see CLAUDE.md) —
// everything around it stays Chakra.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton h="60vh" rounded="md" />,
});

type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

/** Parses the editor text as JSON and validates it against the config schema. */
function validate(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      errors: [`Invalid JSON: ${(error as Error).message}`],
    };
  }
  const result = appConfigSchema.safeParse(parsed);
  if (result.success) return { ok: true };
  return {
    ok: false,
    errors: result.error.issues.map(
      (issue) =>
        `${issue.path.length ? issue.path.join(".") : "(root)"}: ${issue.message}`,
    ),
  };
}

export function ConfigEditor() {
  const { data: current, isLoading } = api.admin.config.getCurrent.useQuery();
  const utils = api.useUtils();
  const { resolvedTheme } = useTheme();

  const [text, setText] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Seed the editor once the current config arrives.
  useEffect(() => {
    if (current && text === null) {
      setText(JSON.stringify(current.data, null, 2));
    }
  }, [current, text]);

  const validation = useMemo(
    () => (text === null ? null : validate(text)),
    [text],
  );

  const save = api.admin.config.save.useMutation(
    toastMutationOptions({
      successTitle: "Configuration saved",
      successDescription: (result: { version: number }) =>
        `Saved as version ${result.version}.`,
      errorTitle: "Could not save configuration",
      errorDescription: "The configuration was not saved. Please try again.",
      onDone: async () => {
        await Promise.all([
          utils.admin.config.getCurrent.invalidate(),
          utils.admin.config.history.invalidate(),
          utils.admin.config.getResolved.invalidate(),
        ]);
        setMessage("");
      },
    }),
  );

  const canSave = validation?.ok === true && !save.isPending;

  const handleSave = () => {
    if (text === null || validation?.ok !== true) return;
    const data = appConfigSchema.parse(JSON.parse(text));
    save.mutate({ data, message: message.trim() || undefined });
  };

  if (isLoading || text === null) {
    return <Skeleton h="60vh" rounded="md" />;
  }

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="fg.muted">
        Editing version {current?.version}. Saving creates a new version; the
        previous one stays in history and can be restored.
      </Text>

      <Box borderWidth="1px" borderColor="border" rounded="md" overflow="hidden">
        <MonacoEditor
          height="60vh"
          defaultLanguage="json"
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          value={text}
          onChange={(value) => setText(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
          }}
        />
      </Box>

      {validation && !validation.ok && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Configuration is invalid</Alert.Title>
            <Alert.Description>
              <List.Root fontSize="sm">
                {validation.errors.map((err, i) => (
                  <List.Item key={i} fontFamily="mono" wordBreak="break-all">
                    {err}
                  </List.Item>
                ))}
              </List.Root>
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <HStack gap={4} align="end" wrap="wrap">
        <Field.Root flex="1" minW="2xs">
          <Field.Label>Change description (optional)</Field.Label>
          <Input
            placeholder="What did you change and why?"
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field.Root>
        <Button
          colorPalette="blue"
          loading={save.isPending}
          disabled={!canSave}
          onClick={handleSave}
        >
          Save new version
        </Button>
      </HStack>
    </Stack>
  );
}
