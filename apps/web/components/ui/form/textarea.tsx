import { forwardRef } from "react";
import TextareaAutosize, { type TextareaAutosizeProps } from "react-textarea-autosize";

import {
  fieldControlClassName,
  type FieldControlProps,
  getFieldControlAriaInvalid,
} from "./field-control";

type TextAreaProps = TextareaAutosizeProps & FieldControlProps;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, invalid, radius, variant, ...props }, ref) => {
    const ariaInvalid = props["aria-invalid"];

    return (
      <TextareaAutosize
        {...props}
        aria-invalid={getFieldControlAriaInvalid(invalid, ariaInvalid)}
        className={fieldControlClassName({ ariaInvalid, className, invalid, multiline: true, radius, variant })}
        ref={ref}
      />
    );
  },
);

TextArea.displayName = "TextArea";
