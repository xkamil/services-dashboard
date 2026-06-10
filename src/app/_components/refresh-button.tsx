"use client";

import { IconButton, type IconButtonProps } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";

type RefreshButtonProps = Omit<IconButtonProps, "aria-label" | "children"> & {
  /** Whether a refresh is in flight; shows a spinner and disables the button. */
  loading?: boolean;
  onRefresh: () => void;
};

/**
 * Outline icon button that re-fetches a table's data. Pass a query's `refetch`
 * as `onRefresh` and its `isFetching` as `loading`. Extra props (e.g. `ml`)
 * pass through to the underlying IconButton for placement.
 */
export function RefreshButton({
  loading,
  onRefresh,
  ...buttonProps
}: RefreshButtonProps) {
  return (
    <IconButton
      aria-label="Refresh data"
      title="Refresh data"
      variant="outline"
      loading={loading}
      onClick={onRefresh}
      {...buttonProps}
    >
      <RefreshCw size={16} aria-hidden />
    </IconButton>
  );
}
