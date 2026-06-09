"use client";

import { Box, Center, HStack, Link, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export interface IconLinkProps {
  /** Icon name — resolves to `/icons/{name}.svg` in the public folder. */
  name: string;
  /** Optional URL. When set, the icon becomes a link. */
  url?: string;
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
 * Loads `/icons/{name}.svg` and inlines it into the DOM. Inlining (rather
 * than an `<img src>`) lets monochrome icons that use `fill="currentColor"`
 * inherit the theme foreground (`color="fg"`), so they stay visible on both
 * light and dark themes. Multicolor icons keep their own explicit fills.
 *
 * If the asset is missing, falls back to the first letter of the name in a
 * circle. Keyed by `name` from the parent so state resets on name change.
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
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/icons/${name}.svg`)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("missing"))))
      .then((text) => active && setSvg(text))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [name]);

  if (failed) {
    return (
      <Center
        boxSize={`${size}px`}
        rounded="full"
        bg="bg.muted"
        color="fg"
        fontWeight="bold"
        fontSize={`${Math.round(size * 0.7)}px`}
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
    <Box
      boxSize={`${size}px`}
      color="fg"
      role="img"
      aria-label={name}
      title={title}
      css={{ "& svg": { width: "100%", height: "100%", display: "block" } }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
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
  // Show the tooltip only when the label isn't already rendered as text.
  const tooltip = showLabel ? undefined : text;
  const content = showLabel ? (
    <HStack gap={2}>
      <IconImage key={name} name={name} size={size} />
      <Text>{text}</Text>
    </HStack>
  ) : (
    <IconImage key={name} name={name} size={size} title={tooltip} />
  );

  if (!url) return content;

  return (
    <Link
      href={url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      title={tooltip}
      display="inline-flex"
      lineHeight={0}
      _hover={{ opacity: 0.8, textDecoration: showLabel ? "underline" : "none" }}
    >
      {content}
    </Link>
  );
}
