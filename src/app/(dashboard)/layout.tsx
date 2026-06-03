import { Box, Container } from "@chakra-ui/react";

import { Navbar } from "~/app/_components/navbar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box minH="100vh" bg="bg">
      <Navbar />
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}
