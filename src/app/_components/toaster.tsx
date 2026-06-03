"use client";

import {
  Toaster as ChakraToaster,
  Collapsible,
  Portal,
  Stack,
  Text,
  Toast,
  createToaster,
} from "@chakra-ui/react";

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
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => {
          const colorPalette =
            TYPE_COLOR_PALETTE[toast.type ?? "info"] ?? "gray";
          const details =
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
                {details && (
                  <Collapsible.Root mt="1">
                    <Collapsible.Trigger
                      cursor="pointer"
                      fontSize="xs"
                      fontWeight="medium"
                      textDecoration="underline"
                    >
                      Details
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <Text
                        mt="1"
                        fontSize="xs"
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                        opacity={0.9}
                      >
                        {details}
                      </Text>
                    </Collapsible.Content>
                  </Collapsible.Root>
                )}
              </Stack>
              {toast.closable && <Toast.CloseTrigger />}
            </Toast.Root>
          );
        }}
      </ChakraToaster>
    </Portal>
  );
}
