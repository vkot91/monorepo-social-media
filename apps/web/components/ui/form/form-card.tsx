import type { FormHTMLAttributes } from "react";

import { cn } from "#/lib/utils";

type FormCardProps = FormHTMLAttributes<HTMLFormElement>;

export const FormCard = ({ children, className, ...props }: FormCardProps) => {
  return (
    <form
      className={cn(
        "grid w-full max-w-110 gap-4 rounded-3xl border border-stone-300 bg-stone-50 p-8 shadow-2xl shadow-slate-900/10",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
};
