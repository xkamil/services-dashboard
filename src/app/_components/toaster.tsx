"use client";

import {
  Toaster as ChakraToaster,
  Box,
  Button,
  Portal,
  Stack,
  Text,
  Toast,
  createToaster,
} from "@chakra-ui/react";
import { useState } from "react";

import { AppDialog, useLastValue } from "~/app/_components/dialog-utils";

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  max: 5,
});

// Toast type -> Chakra color palette.
// success: green, info: gray, error: red (per app design).
const TYPE_COLOR_PALETTE: Record<string, string> = {
  success: "green",
  info: "gray",
  error: "red",
};

export function Toaster() {
  const [details, setDetails] = useState<string | null>(null);
  // Keep the text rendered through the dialog's close animation.
  const shownDetails = useLastValue(details);

  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => {
          const colorPalette =
            TYPE_COLOR_PALETTE[toast.type ?? "info"] ?? "gray";
          const toastDetails =
            typeof toast.meta?.details === "string"
              ? toast.meta.details
              : undefined;

          return (
            <Toast.Root width={{ md: "sm" }} colorPalette={colorPalette}>
              <Toast.Indicator />
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && (
                  <Toast.Description>{toast.description}</Toast.Description>
                )}
                {toastDetails && (
                  <Button
                    variant="plain"
                    size="xs"
                    alignSelf="flex-start"
                    px="0"
                    mt="1"
                    fontSize="xs"
                    fontWeight="medium"
                    textDecoration="underline"
                    onClick={() => setDetails(toastDetails)}
                  >
                    View details
                  </Button>
                )}
              </Stack>
              {toast.closable && <Toast.CloseTrigger />}
            </Toast.Root>
          );
        }}
      </ChakraToaster>
      <AppDialog
        open={!!details}
        onClose={() => setDetails(null)}
        title="Error details"
        maxW="lg"
        footer={
          <Button variant="ghost" onClick={() => setDetails(null)}>
            Close
          </Button>
        }
      >
        <Box maxH="60vh" overflowY="auto">
          <Text fontSize="sm" whiteSpace="pre-wrap" wordBreak="break-word">
            {shownDetails}
          </Text>
        </Box>
      </AppDialog>
    </Portal>
  );
}
