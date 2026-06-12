"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type SecretKey } from "~/lib/secrets";
import { api } from "~/trpc/react";

import { SecretsDialog } from "./secrets-dialog";

export type SecretStatus = {
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
  /** Opens the shared Secrets management modal. */
  openSecrets: () => void;
};

const SecretsContext = createContext<SecretsContextValue | null>(null);

/**
 * Provides the current user's secret-status (which secrets are set, never their
 * values) to the component tree, plus a way to open the shared Secrets modal
 * from anywhere. Mount once around authenticated pages.
 */
export function SecretsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = api.secrets.list.useQuery();
  const [open, setOpen] = useState(false);
  const openSecrets = useCallback(() => setOpen(true), []);

  const value = useMemo<SecretsContextValue>(() => {
    const secrets = (data ?? []) as SecretStatus[];
    const setKeys = new Set(secrets.filter((s) => s.isSet).map((s) => s.key));
    return {
      secrets,
      isLoading,
      isSet: (key) => setKeys.has(key),
      openSecrets,
    };
  }, [data, isLoading, openSecrets]);

  return (
    <SecretsContext.Provider value={value}>
      {children}
      <SecretsDialog open={open} onClose={() => setOpen(false)} />
    </SecretsContext.Provider>
  );
}

/**
 * Access the current user's secret status. Use `isSet(key)` to hide or disable
 * features that depend on a secret being configured, or `openSecrets()` to let
 * the user set one.
 */
export function useSecrets(): SecretsContextValue {
  const ctx = useContext(SecretsContext);
  if (!ctx) {
    throw new Error("useSecrets must be used within a SecretsProvider");
  }
  return ctx;
}
