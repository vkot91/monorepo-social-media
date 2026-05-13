import type { FormHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "#/lib/utils";

type FieldProps = LabelHTMLAttributes<HTMLLabelElement> & {
  error?: string;
  label: string;
};

export const Field = ({ children, className, error, label, ...props }: FieldProps) => {
  return (
    <label className={cn("grid gap-2 font-bold text-slate-800", className)} {...props}>
      <span>{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

export const FieldError = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }

  return <span className="text-sm font-bold text-red-700">{message}</span>;
}

export const FormError = ({ children }: { children?: ReactNode }) => {
  if (!children) {
    return null;
  }

  return (
    <p className="m-0 font-bold text-red-700" role="alert">
      {children}
    </p>
  );
}

type FormCardProps = FormHTMLAttributes<HTMLFormElement>;

export const FormCard = ({ children, className, ...props }: FormCardProps) => {
  return (
    <form
      className={cn(
        "grid w-full max-w-[440px] gap-4 rounded-3xl border border-stone-300 bg-stone-50 p-8 shadow-2xl shadow-slate-900/10",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}
