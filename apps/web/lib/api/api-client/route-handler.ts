import { NextResponse } from "next/server";

import type { ApiFieldErrors } from "../types";
import { ApiRequestError, AuthRequiredError } from "../utils/errors";

export const parseJsonBody = async (request: Request) => {
  try {
    return (await request.json()) as unknown;
  } catch {
    return {};
  }
};

export const validationErrorResponse = <TField extends string>(message: string, errors: ApiFieldErrors<TField>) =>
  NextResponse.json(
    {
      errors,
      message,
    },
    {
      status: 400,
    },
  );

type FlattenableValidationError = {
  flatten: () => {
    fieldErrors: ApiFieldErrors;
  };
};

export const zodValidationErrorResponse = (message: string, error: FlattenableValidationError) =>
  validationErrorResponse(message, error.flatten().fieldErrors as ApiFieldErrors);

export const apiErrorResponse = (error: unknown, fallbackMessage = "Request failed") => {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json(
      {
        errors: {},
        message: error.message,
      },
      {
        status: 401,
      },
    );
  }

  if (error instanceof ApiRequestError) {
    return NextResponse.json(
      {
        errors: error.errors,
        message: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  return NextResponse.json(
    {
      errors: {},
      message: fallbackMessage,
    },
    {
      status: 500,
    },
  );
};
