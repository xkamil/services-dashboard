import { Container } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { EnvironmentsNav } from "./_components/environments-nav";

export default function EnvironmentsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <EnvironmentsNav />
      <Container maxW="6xl" py={8}>
        {children}
      </Container>
    </>
  );
}
