"use client";

import { Dialog, Portal } from "@chakra-ui/react";
import { useRef, type ReactNode } from "react";

/**
 * Keeps the last non-null value available while `value` is null, so a dialog can
 * keep rendering its content (e.g. a user's email) during its close animation.
 */
export function useLastValue<T>(value: T | null): T | null {
  const ref = useRef<T | null>(null);
  if (value) ref.current = value;
  return value ?? ref.current;
}

/** Shared modal shell: backdrop, positioner, header/body/footer layout. */
export function AppDialog({
  open,
  onClose,
  title,
  role,
  closeOnInteractOutside,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  role?: "dialog" | "alertdialog";
  closeOnInteractOutside?: boolean;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      role={role}
      closeOnInteractOutside={closeOnInteractOutside}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
            <Dialog.Footer>{footer}</Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
