import { Heading, Stack, Text } from "@chakra-ui/react";

export default function DashboardPage() {
  return (
    <Stack gap={2}>
      <Heading size="2xl">Dashboard</Heading>
      <Text color="fg.muted">Welcome to your dashboard.</Text>
    </Stack>
  );
}
