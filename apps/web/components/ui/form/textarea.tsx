import { forwardRef } from "react";
import TextareaAutosize, { type TextareaAutosizeProps } from "react-textarea-autosize";

import {
  fieldControlClassName,
  type FieldControlProps,
  getFieldControlAriaInvalid,
} from "./field-control";

type TextAreaProps = TextareaAutosizeProps & FieldControlProps;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, invalid, ...props }, ref) => {
    const ariaInvalid = props["aria-invalid"];

    return (
      <TextareaAutosize
        {...props}
        aria-invalid={getFieldControlAriaInvalid(invalid, ariaInvalid)}
        className={fieldControlClassName({ ariaInvalid, className, invalid, multiline: true })}
        ref={ref}
      />
    );
  },
);

TextArea.displayName = "TextArea";
