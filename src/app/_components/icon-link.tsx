"use client";

import { Center, HStack, Image, Link, Text } from "@chakra-ui/react";
import { useState } from "react";

export interface IconLinkProps {
  /** Icon name — resolves to `/icons/{name}.svg` in the public folder. */
  name: string;
  /** Optional URL. When set, the icon becomes a link. */
  url: string;
  /** Box size of the icon in pixels. */
  size?: number;
  /**
   * Link target. Defaults to `_blank`. Pass `_self` (or any other value)
   * to override. `rel` is set to `noopener noreferrer` for `_blank`.
   */
  target?: React.HTMLAttributeAnchorTarget;
  /** Accessible label / tooltip, and the text shown when `showLabel` is set. Defaults to the icon name. */
  label?: string;
  /** When true, renders the label as text to the right of the icon. Defaults to false. */
  showLabel?: boolean;
}

/**
 * Renders `/icons/{name}.svg` as a native image, letting the browser load and
 * cache the asset (no runtime `fetch`).
 *
 * If the asset is missing or fails to load, falls back to the first letter of
 * the name in a circle. Keyed by `name` from the parent so state resets on name
 * change.
 */
function IconImage({
  name,
  size,
  title,
}: {
  name: string;
  size: number;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Center
        boxSize={`${size}px`}
        rounded="full"
        bg="bg.muted"
        color="fg"
        fontWeight="bold"
        fontSize={`${Math.round(size * 1.2)}px`}
        paddingBottom={"5px"}
        textTransform="uppercase"
        userSelect="none"
        aria-label={name}
        title={title}
      >
        {name.charAt(0)}
      </Center>
    );
  }

  return (
    <Image
      src={`/icons/${name.toLowerCase()}.svg`}
      boxSize={`${size}px`}
      alt={name}
      title={title}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * An icon resolved from the public `/icons` folder, optionally wrapped
 * in a link. Falls back to a lettered circle when the icon is missing.
 */
export function IconLink({
  name,
  url,
  size = 20,
  target = "_blank",
  label,
  showLabel = false,
}: IconLinkProps) {
  const text = label ?? name;
  const content = showLabel ? (
    <HStack gap={2}>
      <IconImage key={name} name={name} size={size} />
      <Text>{text}</Text>
    </HStack>
  ) : (
    <IconImage key={name} name={name} size={size} title={url} />
  );

  return (
    <Link
      href={url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      title={url}
      display="inline-flex"
      lineHeight={0}
      _hover={{ opacity: 0.8, textDecoration: showLabel ? "underline" : "none" }}
    >
      {content}
    </Link>
  );
}
