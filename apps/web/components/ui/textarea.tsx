import { forwardRef } from "react";
import { cn } from "#/lib/utils";
import TextareaAutosize, { type TextareaAutosizeProps } from "react-textarea-autosize";

type TextAreaProps = TextareaAutosizeProps;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextareaAutosize
        className={cn(
          "min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/15 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-70",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

TextArea.displayName = "TextArea";
