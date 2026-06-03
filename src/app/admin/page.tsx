import { Heading, Stack, Text } from "@chakra-ui/react";

export default function AdminPage() {
  return (
    <Stack gap={2}>
      <Heading size="2xl">Admin</Heading>
      <Text color="fg.muted">Administrator area.</Text>
    </Stack>
  );
}