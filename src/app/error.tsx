"use client";

import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Stack minH="60vh" align="center" justify="center" gap={4} px={4}>
      <Stack color="fg.muted" align="center">
        <AlertTriangle size={40} aria-hidden />
      </Stack>
      <Heading size="lg">Something went wrong</Heading>
      <Text color="fg.muted" textAlign="center" maxW="md">
        An unexpected error occurred while loading this page.
        {error.digest && ` Error reference: ${error.digest}.`}
      </Text>
      <Button colorPalette="blue" onClick={reset}>
        Try again
      </Button>
    </Stack>
  );
}
