"use client";

import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = api.auth.me.useQuery();
  const logout = api.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box bg="white" p={8} rounded="lg" shadow="md" w="full" maxW="md">
        <Stack gap={4}>
          <Heading size="lg">Services Dashboard</Heading>
          {session && (
            <Stack gap={1}>
              <Text fontSize="sm" color="gray.500">Signed in as</Text>
              <Text fontWeight="medium">{session.email}</Text>
              <Text fontSize="sm" color="gray.400">Role: {session.role}</Text>
            </Stack>
          )}
          <Button
            colorPalette="red"
            variant="outline"
            loading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
