import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "#/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-extrabold no-underline transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-65",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "min-h-11 px-5",
        sm: "min-h-9 px-4",
        lg: "min-h-12 px-6 text-base",
      },
      variant: {
        primary: "bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-700/20",
        secondary:
          "border border-stone-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-stone-50 focus-visible:ring-slate-700/15",
        ghost: "text-slate-700 hover:bg-stone-200 focus-visible:ring-slate-700/15",
        danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700/20",
      },
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, type = "button", ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ size, variant }), className)}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
