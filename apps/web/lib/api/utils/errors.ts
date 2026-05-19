import { redirect } from "next/navigation";

import { createErrorActionResult } from "../requests/responses";
import { ActionResult, ApiFieldErrors } from "../types";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication is required");
    this.name = "AuthRequiredError";
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: ApiFieldErrors = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const createCommonActionError = <TField extends string = string>(
  error: unknown,
  fallbackMessage = "Failed to perform the request. Please try again.",
): ActionResult<TField> => {
  if (error instanceof AuthRequiredError) {
    redirect("/login");
  }

  if (error instanceof ApiRequestError) {
    return createErrorActionResult(error.message, error.errors as ApiFieldErrors<TField>);
  }

  return createErrorActionResult(fallbackMessage);
};
