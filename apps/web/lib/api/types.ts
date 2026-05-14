export type ApiActionStatus = "error" | "idle" | "success";

export type ApiFieldErrors<TField extends string = string> = Partial<Record<TField, string[]>>;

export interface ApiErrorResponse<TField extends string = string, TData = null> {
  data: TData | null;
  errors: ApiFieldErrors<TField>;
  message: string | null;
  status: ApiActionStatus;
}

export type RequestType = "server" | "web";

export type QueryValue = boolean | number | string | null | undefined;

export type ApiRoute<
  TConfig extends {
    auth?: boolean;
    body?: unknown;
    queryParams?: object;
    requestType?: RequestType;
    response: unknown;
  },
> = TConfig;
