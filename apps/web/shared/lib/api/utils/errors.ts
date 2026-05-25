import { ApiFieldErrors } from "../types";

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
