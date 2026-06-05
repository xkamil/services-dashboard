"use client";

import { Alert, Link } from "@chakra-ui/react";
import { type ReactNode } from "react";

import { SECRET_META, type SecretKey } from "~/lib/secrets";

import { useSecrets } from "./secrets-context";

type Props = {
  /** The secret this content depends on. */
  secret: SecretKey;
  children: ReactNode;
};

/**
 * Gates a page or section behind a user secret. While the secret is unset the
 * children are hidden and a notice is shown instead, with a link that opens the
 * Secrets modal so the user can set it. Drop around any content:
 *
 *   <SecretGuard secret="JENKINS_API_TOKEN">…</SecretGuard>
 */
export function SecretGuard({ secret, children }: Props) {
  const { isSet, isLoading, openSecrets } = useSecrets();

  // Avoid flashing gated content before we know whether the secret is set.
  if (isLoading) return null;

  if (isSet(secret)) return <>{children}</>;

  const { label } = SECRET_META[secret];

  return (
    <Alert.Root status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{label} has to be set</Alert.Title>
        <Alert.Description>
          This section needs your {label}.{" "}
          <Link colorPalette="blue" fontWeight="medium" onClick={openSecrets}>
            Set it now
          </Link>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
