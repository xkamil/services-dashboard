/**
 * Presentation metadata for environment {@link EnvironmentType}s: the label and
 * Chakra colour palette each stage renders with. Kept separate from the schema
 * so the schema stays dependency-light and purely structural.
 */

import type { EnvironmentType } from "~/lib/config/schema";

/** A Chakra colour token, optionally varying by colour mode. */
export type ColorToken = string | { base: string; _dark: string };

export interface EnvironmentTypeMeta {
  /** Human-facing label shown on badges/tabs. */
  label: string;
  /** Chakra colour palette name (drives the solid badge fill). */
  colorPalette: string;
  /**
   * Explicit accent colour for tinted text/borders (env nav). Defined here so
   * the shade lives in one place; deliberately deep, and lighter on the dark
   * panel so it stays legible in both modes.
   */
  accentColor: ColorToken;
}

/** TEST = green, STAGE = orange, PROD = red — deep shades. */
export const ENVIRONMENT_TYPE_META: Record<EnvironmentType, EnvironmentTypeMeta> = {
  TEST: {
    label: "TEST",
    colorPalette: "green",
    accentColor: { base: "green.500", _dark: "green.400" },
  },
  STAGE: {
    label: "STAGE",
    colorPalette: "orange",
    accentColor: { base: "orange.500", _dark: "orange.400" },
  },
  PROD: {
    label: "PROD",
    colorPalette: "red",
    accentColor: { base: "red.500", _dark: "red.400" },
  },
};
