import { forwardRef, type InputHTMLAttributes } from "react";

import {
  fieldControlClassName,
  type FieldControlProps,
  getFieldControlAriaInvalid,
} from "./field-control";

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldControlProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, radius, variant, ...props }, ref) => {
    const ariaInvalid = props["aria-invalid"];

    return (
      <input
        {...props}
        aria-invalid={getFieldControlAriaInvalid(invalid, ariaInvalid)}
        className={fieldControlClassName({ ariaInvalid, className, invalid, radius, variant })}
        ref={ref}
      />
    );
  },
);

Input.displayName = "Input";
