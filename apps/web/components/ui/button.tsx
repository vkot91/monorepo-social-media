import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "#/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-lg text-sm font-extrabold no-underline transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-65",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-3",
        lg: "min-h-12 px-6 text-base",
      },
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-hover focus-visible:ring-primary/20",
        secondary:
          "border border-line bg-surface text-text hover:border-line-strong hover:bg-subtle-surface focus-visible:ring-text/15",
        ghost: "text-text hover:bg-subtle-surface focus-visible:ring-text/15",
        danger: "bg-danger text-on-danger hover:bg-danger-hover focus-visible:ring-danger/20",
      },
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, disabled, loading, size, variant, type = "button", ...props }, ref) => {
    return (
      <button
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ size, variant }), className)}
        disabled={disabled || loading}
        ref={ref}
        type={type}
        {...props}
      >
        {loading ? <LoaderCircle aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
