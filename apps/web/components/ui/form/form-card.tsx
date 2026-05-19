import type { FormHTMLAttributes } from "react";

import { cn } from "#/lib/utils";

type FormCardProps = FormHTMLAttributes<HTMLFormElement>;

export const FormCard = ({ children, className, ...props }: FormCardProps) => {
  return (
    <form
      className={cn(
        "grid w-full max-w-110 gap-4 rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-text/10",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
};
