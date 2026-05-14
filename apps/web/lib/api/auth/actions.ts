"use server";

import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "@social/contracts";
import { redirect } from "next/navigation";

import { createErrorResponse, createSuccessResponse } from "../requests/responses";
import { serverRequest } from "../requests/server-request";
import { ApiErrorResponse } from "../types";
import { generateCommonError } from "../utils/errors";
import { clearAuthCookies, getRefreshToken } from "./cookies";
import { persistAuthSession } from "./session";

type LoginField = Extract<keyof LoginInput, string>;
type RegisterField = Extract<keyof RegisterInput, string>;

export const login = async (data: LoginInput): Promise<ApiErrorResponse<LoginField>> => {
  const input = loginSchema.safeParse(data);

  if (!input.success) {
    return createErrorResponse("Enter a valid email and password.", input.error.flatten().fieldErrors);
  }

  try {
    const response = await serverRequest("/auth/login", "POST", {
      body: input.data,
    });

    await persistAuthSession(response);

    return createSuccessResponse();
  } catch (error) {
    return generateCommonError<LoginField>(error);
  }
};

export const signup = async (data: RegisterInput): Promise<ApiErrorResponse<RegisterField>> => {
  const input = registerSchema.safeParse(data);

  if (!input.success) {
    return createErrorResponse("Please check the registration fields.", input.error.flatten().fieldErrors);
  }

  try {
    const response = await serverRequest("/auth/register", "POST", {
      body: input.data,
    });

    await persistAuthSession(response);

    return createSuccessResponse();
  } catch (error) {
    return generateCommonError<RegisterField>(error);
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
    });
    await clearAuthCookies();
  } catch (error) {
    return generateCommonError(error);
  }

  redirect("/login");
};
