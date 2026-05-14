import type { LabelHTMLAttributes } from "react";

import { cn } from "#/lib/utils";

import { FieldError } from "./field-error";

type FieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  error?: string;
  label: string;
};

export const Field = ({ children, className, error, label, ...props }: FieldProps) => {
  return (
    <label className={cn("grid gap-2 font-bold text-text", className)} {...props}>
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
};
