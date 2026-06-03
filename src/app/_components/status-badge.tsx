import { Badge } from "@chakra-ui/react";

import type { UserStatus } from "~/lib/validation/admin";

const PALETTE: Record<UserStatus, string> = {
  ACTIVE: "green",
  BLOCKED: "red",
  PENDING_VERIFICATION: "yellow",
};

const LABEL: Record<UserStatus, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
  PENDING_VERIFICATION: "Pending verification",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge colorPalette={PALETTE[status]}>{LABEL[status]}</Badge>;
}
