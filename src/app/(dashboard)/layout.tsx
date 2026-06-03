import { Box, Container } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { Navbar, SECTIONS } from "~/app/_components/navbar";

export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Box minH="100vh" bg="bg">
      <Navbar sections={SECTIONS} />
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </Box>
  );
}
