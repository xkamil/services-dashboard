"use client";

import { Box, Circle, Float, IconButton, type IconButtonProps } from "@chakra-ui/react";
import { Filter } from "lucide-react";

type ClearFiltersButtonProps = Omit<IconButtonProps, "aria-label" | "children"> & {
  /** Number of currently active filters; shown as a badge over the icon. */
  activeFilterCount: number;
  /** Clears every filter. */
  onClear: () => void;
};

/**
 * Ghost icon button that clears all active filters, with a badge showing how
 * many are set. Stays invisible (but keeps its layout space) when no filters
 * are active, and turns red on hover to signal the destructive action. Extra
 * props (e.g. `size`) pass through to the underlying IconButton.
 */
export function ClearFiltersButton({
  activeFilterCount,
  onClear,
  ...buttonProps
}: ClearFiltersButtonProps) {
  return (
    <Box
      pos="relative"
      flex="none"
      visibility={activeFilterCount === 0 ? "hidden" : "visible"}
    >
      <IconButton
        aria-label="Clear all filters"
        title="Clear all filters"
        variant="ghost"
        onClick={onClear}
        _hover={{ bg: "red.subtle", color: "red.fg" }}
        {...buttonProps}
      >
        <Filter size={16} aria-hidden />
      </IconButton>
      <Float placement="top-end" pointerEvents="none">
        <Circle
          size="5"
          bg="colorPalette.solid"
          color="colorPalette.contrast"
          fontSize="xs"
          fontWeight="bold"
        >
          {activeFilterCount}
        </Circle>
      </Float>
    </Box>
  );
}
