"use server";

import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "@social/contracts";
import { redirect } from "next/navigation";

import { createErrorActionResult, createSuccessActionResult } from "../requests/responses";
import { serverRequest } from "../requests/server-request";
import { ActionResult } from "../types";
import { createCommonActionError } from "../utils/errors";
import { clearAuthCookies, getRefreshToken } from "./cookies";
import { persistAuthSession } from "./session";

type LoginField = Extract<keyof LoginInput, string>;
type RegisterField = Extract<keyof RegisterInput, string>;

export const login = async (data: LoginInput): Promise<ActionResult<LoginField>> => {
  const input = loginSchema.safeParse(data);

  if (!input.success) {
    return createErrorActionResult("Enter a valid email and password.", input.error.flatten().fieldErrors);
  }

  try {
    const response = await serverRequest("/auth/login", "POST", {
      body: input.data,
      auth: false,
    });

    await persistAuthSession(response);

    return createSuccessActionResult();
  } catch (error) {
    return createCommonActionError<LoginField>(error);
  }
};

export const signup = async (data: RegisterInput): Promise<ActionResult<RegisterField>> => {
  const input = registerSchema.safeParse(data);

  if (!input.success) {
    return createErrorActionResult("Please check the registration fields.", input.error.flatten().fieldErrors);
  }

  try {
    const response = await serverRequest("/auth/register", "POST", {
      body: input.data,
      auth: false,
    });

    await persistAuthSession(response);

    return createSuccessActionResult();
  } catch (error) {
    return createCommonActionError<RegisterField>(error);
  }
};

export const logout = async () => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    redirect("/login");
  }

  try {
    await serverRequest("/auth/logout", "POST", {
      body: {
        refreshToken,
      },
      auth: false,
    });
    await clearAuthCookies();
  } catch (error) {
    return createCommonActionError(error);
  }

  redirect("/login");
};
