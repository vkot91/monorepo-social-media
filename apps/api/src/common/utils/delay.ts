import { env } from "#config/env";

export const delay = (milliseconds: number) => {
  if (env.NODE_ENV === "development") {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
};
