import { Box, Text } from "@chakra-ui/react";
import { type ReactNode } from "react";

/** The bordered panel that all auth forms sit inside. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      p={8}
      rounded="lg"
      shadow="md"
      w="full"
      maxW="md"
    >
      {children}
    </Box>
  );
}

const TONE_STYLES = {
  error: { bg: "red.subtle", borderColor: "red.muted", color: "red.fg" },
  success: {
    bg: "green.subtle",
    borderColor: "green.muted",
    color: "green.fg",
  },
} as const;

/** Inline error/success message box shown above auth forms. */
export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <Box
      bg={styles.bg}
      borderWidth="1px"
      borderColor={styles.borderColor}
      rounded="md"
      p={3}
    >
      <Text color={styles.color} fontSize="sm">
        {children}
      </Text>
    </Box>
  );
}
