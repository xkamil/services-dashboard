import { Badge } from "@chakra-ui/react";

import { USER_STATUS_META, type UserStatus } from "~/lib/validation/admin";

export function StatusBadge({ status }: { status: UserStatus }) {
  const { label, palette } = USER_STATUS_META[status];
  return <Badge colorPalette={palette}>{label}</Badge>;
}
