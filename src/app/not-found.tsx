import { Button, Heading, Stack, Text } from "@chakra-ui/react";
import { SearchX } from "lucide-react";
import NextLink from "next/link";

export default function NotFoundPage() {
  return (
    <Stack minH="60vh" align="center" justify="center" gap={4} px={4}>
      <Stack color="fg.muted" align="center">
        <SearchX size={40} aria-hidden />
      </Stack>
      <Heading size="lg">Page not found</Heading>
      <Text color="fg.muted" textAlign="center" maxW="md">
        The page you are looking for does not exist or may have been moved.
      </Text>
      <Button colorPalette="blue" asChild>
        <NextLink href="/">Go to dashboard</NextLink>
      </Button>
    </Stack>
  );
}
