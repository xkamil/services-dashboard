"use client";

import {
  CloseButton,
  Input,
  InputGroup,
  type InputGroupProps,
  type InputProps,
} from "@chakra-ui/react";

type SearchInputProps = Omit<
  InputGroupProps,
  "children" | "startElement" | "endElement" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: InputProps["size"];
};

/**
 * Text input for filtering, with a clear button that appears at the end of the
 * input (inside its boundaries) only while the input has a value.
 *
 * Layout props (maxW, flex, width, …) size the whole control and are applied to
 * the InputGroup, so the clear button stays anchored to the input's right edge.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  size,
  ...groupProps
}: SearchInputProps) {
  return (
    <InputGroup
      {...groupProps}
      endElement={
        value ? (
          <CloseButton
            me="-2"
            aria-label="Clear search"
            onClick={() => onChange("")}
          />
        ) : undefined
      }
    >
      <Input
        flex="1"
        size={size}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </InputGroup>
  );
}
