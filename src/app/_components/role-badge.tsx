import { Badge } from "@chakra-ui/react";

import { ROLE_META, coerceRole } from "~/lib/roles";

export function RoleBadge({ role }: { role: string }) {
  const known = coerceRole(role);
  const meta = known ? ROLE_META[known] : null;
  return <Badge colorPalette={meta?.palette}>{meta?.label ?? role}</Badge>;
}
