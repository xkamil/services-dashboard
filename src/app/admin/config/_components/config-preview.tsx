"use client";

import { Box, Button, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Copy } from "lucide-react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useMemo } from "react";

import { showSuccessToast } from "~/lib/toast";
import { api } from "~/trpc/react";

// Same browser-only Monaco loader used by the editor; here it is read-only.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton h="60vh" rounded="md" />,
});

export function ConfigPreview() {
  const { data, isLoading } = api.admin.config.getResolved.useQuery({});
  const { resolvedTheme } = useTheme();

  const json = useMemo(
    () => (data ? JSON.stringify(data, null, 2) : ""),
    [data],
  );

  if (isLoading) {
    return <Skeleton h="60vh" rounded="md" />;
  }

  return (
    <Stack gap={4}>
      <HStack justify="space-between" align="start" wrap="wrap" gap={2}>
        <Text fontSize="sm" color="fg.muted" maxW="3xl">
          The fully resolved configuration the application consumes: defaults
          merged with overrides and every <code>{"${placeholder}"}</code>{" "}
          substituted from environment variables. Read-only — reflects the last
          saved version.
        </Text>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(json);
            showSuccessToast("Copied resolved configuration");
          }}
        >
          <Copy size={14} aria-hidden />
          Copy JSON
        </Button>
      </HStack>

      <Box borderWidth="1px" borderColor="border" rounded="md" overflow="hidden">
        <MonacoEditor
          height="60vh"
          defaultLanguage="json"
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          value={json}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
          }}
        />
      </Box>
    </Stack>
  );
}
