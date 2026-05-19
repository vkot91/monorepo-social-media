import "server-only";

import { type AuthUserDto } from "@social/contracts";
import { redirect } from "next/navigation";

import { serverRequest } from "../requests/server-request";
import { AuthRequiredError } from "../utils/errors";

export const getActiveUser = async (): Promise<AuthUserDto> => {
  try {
    return await serverRequest("/auth/me", "GET", {});
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    throw error;
  }
};
