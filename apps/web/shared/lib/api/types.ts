export type ApiFieldErrors<TField extends string = string> = Partial<Record<TField, string[]>>;

export type QueryValue = boolean | number | string | null | undefined;

export type ApiRoute<
  TConfig extends {
    auth?: boolean;
    body?: unknown;
    params?: object;
    queryParams?: object;
    response: unknown;
  },
> = TConfig;
