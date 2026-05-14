import { cva, type VariantProps } from "class-variance-authority";
import type { AriaAttributes } from "react";

import { cn } from "#/lib/utils";

export const fieldControlVariants = cva(
  "min-h-11 w-full px-3.5 text-sm text-text outline-none transition-colors placeholder:text-muted-text focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-70",
  {
    defaultVariants: {
      radius: "lg",
      variant: "borderless",
    },
    variants: {
      radius: {
        "2xl": "rounded-2xl",
        lg: "rounded-lg",
        md: "rounded-md",
        xl: "rounded-xl",
      },
      variant: {
        bordered: "border bg-surface",
        borderless: "border bg-subtle-surface",
      },
    },
  },
);

export type FieldControlProps = VariantProps<typeof fieldControlVariants> & {
  invalid?: boolean;
};

type FieldControlClassNameOptions = FieldControlProps & {
  ariaInvalid?: AriaAttributes["aria-invalid"];
  className?: string;
  multiline?: boolean;
};

const isAriaInvalid = (value: AriaAttributes["aria-invalid"]) =>
  value === true || value === "true" || value === "grammar" || value === "spelling";

export const getFieldControlInvalidState = (
  invalid: boolean | undefined,
  ariaInvalid: AriaAttributes["aria-invalid"],
) => invalid ?? isAriaInvalid(ariaInvalid);

export const getFieldControlAriaInvalid = (
  invalid: boolean | undefined,
  ariaInvalid: AriaAttributes["aria-invalid"],
) => (invalid === undefined ? ariaInvalid : invalid || undefined);

export const fieldControlClassName = ({
  ariaInvalid,
  className,
  invalid,
  multiline,
  radius,
  variant,
}: FieldControlClassNameOptions) => {
  const isInvalid = getFieldControlInvalidState(invalid, ariaInvalid);
  const resolvedVariant = variant ?? "bordered";

  return cn(
    fieldControlVariants({ radius, variant }),
    multiline && "resize-none py-4 placeholder:text-base placeholder:font-bold placeholder:text-muted-text/75",
    isInvalid ? "border-danger" : resolvedVariant === "bordered" ? "border-line" : "border-transparent",
    className,
  );
};
