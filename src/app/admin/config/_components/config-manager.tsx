"use client";

import { Heading, Stack, Tabs } from "@chakra-ui/react";

import { ConfigEditor } from "./config-editor";
import { ConfigHistory } from "./config-history";
import { ConfigPreview } from "./config-preview";

export function ConfigManager() {
  return (
    <Stack gap={6}>
      <Heading size="lg">Configuration</Heading>
      <Tabs.Root defaultValue="editor" variant="line">
        <Tabs.List>
          <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
          <Tabs.Trigger value="history">History</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="editor" pt={4}>
          <ConfigEditor />
        </Tabs.Content>
        <Tabs.Content value="history" pt={4}>
          <ConfigHistory />
        </Tabs.Content>
        <Tabs.Content value="preview" pt={4}>
          <ConfigPreview />
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
