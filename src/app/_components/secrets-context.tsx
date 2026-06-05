"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { type SecretKey } from "~/lib/secrets";
import { api } from "~/trpc/react";

type SecretStatus = {
  key: SecretKey;
  label: string;
  description: string;
  helpUrl: string | null;
  isSet: boolean;
  updatedAt: Date | null;
};

type SecretsContextValue = {
  secrets: SecretStatus[];
  isLoading: boolean;
  /** Whether the current user has set the given secret. */
  isSet: (key: SecretKey) => boolean;
};

const SecretsContext = createContext<SecretsContextValue | null>(null);

/**
 * Provides the current user's secret-status (which secrets are set, never their
 * values) to the component tree. Mount once around authenticated pages.
 */
export function SecretsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = api.secrets.list.useQuery();

  const value = useMemo<SecretsContextValue>(() => {
    const secrets = (data ?? []) as SecretStatus[];
    const setKeys = new Set(secrets.filter((s) => s.isSet).map((s) => s.key));
    return {
      secrets,
      isLoading,
      isSet: (key) => setKeys.has(key),
    };
  }, [data, isLoading]);

  return (
    <SecretsContext.Provider value={value}>{children}</SecretsContext.Provider>
  );
}

/**
 * Access the current user's secret status. Use `isSet(key)` to hide or disable
 * features that depend on a secret being configured.
 */
export function useSecrets(): SecretsContextValue {
  const ctx = useContext(SecretsContext);
  if (!ctx) {
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return ctx;
}
