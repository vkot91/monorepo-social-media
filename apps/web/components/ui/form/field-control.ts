import type { AriaAttributes } from "react";

import { cn } from "#/lib/utils";

export type FieldControlProps = {
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
}: FieldControlClassNameOptions) => {
  const isInvalid = getFieldControlInvalidState(invalid, ariaInvalid);

  return cn(
    "min-h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-70",
    multiline && "py-2",
    isInvalid ? "border-red-600" : "border-stone-300",
    className,
  );
};
