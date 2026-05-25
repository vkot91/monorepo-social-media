import type { ReactNode } from "react";

export const FormError = ({ children }: { children?: ReactNode }) => {
  if (!children) {
    return null;
  }

  return (
    <p className="m-0 font-bold text-danger" role="alert">
      {children}
    </p>
  );
};
