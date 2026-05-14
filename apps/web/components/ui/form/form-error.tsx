import type { ReactNode } from "react";

export const FormError = ({ children }: { children?: ReactNode }) => {
  if (!children) {
    return null;
  }

  return (
    <p className="m-0 font-bold text-red-700" role="alert">
      {children}
    </p>
  );
};
