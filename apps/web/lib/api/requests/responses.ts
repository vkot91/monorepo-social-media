import { ApiErrorResponse, ApiFieldErrors } from "../types";

export const createIdleResponse = <TField extends string = string, TData = null>(): ApiErrorResponse<
  TField,
  TData
> => ({
  data: null,
  errors: {},
  message: null,
  status: "idle",
});

export const createSuccessResponse = <TData = null, TField extends string = string>(
  message: string | null = null,
  data: TData | null = null,
): ApiErrorResponse<TField, TData> => ({
  data,
  errors: {},
  message,
  status: "success",
});

export const createErrorResponse = <TField extends string = string>(
  message: string,
  errors: ApiFieldErrors<TField> = {},
): ApiErrorResponse<TField> => ({
  data: null,
  errors,
  message,
  status: "error",
});
