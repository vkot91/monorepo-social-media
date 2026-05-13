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
