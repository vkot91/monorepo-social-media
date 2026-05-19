import { ActionResult, ApiFieldErrors } from "../types";

export const createIdleActionResult = <TField extends string = string, TData = null>(): ActionResult<
  TField,
  TData
> => ({
  data: null,
  errors: {},
  message: null,
  status: "idle",
});

export const createSuccessActionResult = <TData = null, TField extends string = string>(
  message: string | null = null,
  data: TData | null = null,
): ActionResult<TField, TData> => ({
  data,
  errors: {},
  message,
  status: "success",
});

export const createErrorActionResult = <TField extends string = string>(
  message: string,
  errors: ApiFieldErrors<TField> = {},
): ActionResult<TField> => ({
  data: null,
  errors,
  message,
  status: "error",
});
