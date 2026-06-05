import { Text } from "@chakra-ui/react";

import { SecretGuard } from "~/app/_components/secret-guard";

export default function DashboardPage() {
  return (
    <SecretGuard secret="JENKINS_API_TOKEN">
      <Text color="fg.muted">Welcome to your dashboard.</Text>
    </SecretGuard>
  );
}
