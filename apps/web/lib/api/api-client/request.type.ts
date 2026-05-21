import type { AuthBackendApiRoutes,AuthBffApiRoutes } from "#/features/auth/lib/routes";
import type { PostsBackendApiRoutes,PostsBffApiRoutes } from "#/features/posts/lib/routes";

import type { ApiRoute } from "../types";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type QueryValue = boolean | number | string | null | undefined;

export type BackendApiRoutes = AuthBackendApiRoutes & PostsBackendApiRoutes;
export type BffApiRoutes = AuthBffApiRoutes & PostsBffApiRoutes;

export type ApiRoutes = BffApiRoutes | BackendApiRoutes;

export type ApiPath<TRoutes extends ApiRoutes> = Extract<keyof TRoutes, string>;
export type MethodFor<TRoutes extends ApiRoutes, TPath extends ApiPath<TRoutes>> = Extract<
  keyof TRoutes[TPath],
  ApiMethod
>;

export type RouteConfig<
  TRoutes extends ApiRoutes,
  TPath extends ApiPath<TRoutes>,
  TMethod extends MethodFor<TRoutes, TPath>,
> = TRoutes[TPath][TMethod];

export type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  maxDelayMs?: number;
  retryMethods?: ApiMethod[];
  retryStatuses?: number[];
};

export type BaseRequestOptions = {
  cache?: RequestCache;
  retry?: boolean | RetryOptions;
  retryOnUnauthorized?: boolean;
};

export type AuthOption<TRoute> =
  TRoute extends ApiRoute<{ auth: infer TAuth extends boolean; response: unknown }>
    ? { auth?: TAuth }
    : { auth?: true };

export type BodyOption<TRoute> =
  TRoute extends ApiRoute<{ body: infer TBody; response: unknown }> ? { body: TBody } : { body?: never };

export type QueryParamsOption<TRoute> =
  TRoute extends ApiRoute<{
    queryParams: infer TQuery extends object;
    response: unknown;
  }>
    ? { queryParams: TQuery }
    : { queryParams?: never };

export type RequestOptions<TRoute> = BaseRequestOptions &
  AuthOption<TRoute> &
  BodyOption<TRoute> &
  QueryParamsOption<TRoute>;

export type NoExtraKeys<TExpected, TActual> = TActual & Record<Exclude<keyof TActual, keyof TExpected>, never>;

export type StrictBodyOption<TRoute, TOptions> =
  TRoute extends ApiRoute<{ body: infer TBody; response: unknown }>
    ? TOptions extends { body: infer TActualBody }
      ? { body: NoExtraKeys<TBody, TActualBody> }
      : { body: TBody }
    : { body?: never };

export type StrictQueryParamsOption<TRoute, TOptions> =
  TRoute extends ApiRoute<{
    queryParams: infer TQuery extends object;
    response: unknown;
  }>
    ? TOptions extends { queryParams: infer TActualQueryParams }
      ? { queryParams: NoExtraKeys<TQuery, TActualQueryParams> }
      : { queryParams: TQuery }
    : { queryParams?: never };

export type StrictRequestOptions<TRoute, TOptions> = NoExtraKeys<RequestOptions<TRoute>, TOptions> &
  Omit<RequestOptions<TRoute>, "body" | "queryParams"> &
  StrictBodyOption<TRoute, TOptions> &
  StrictQueryParamsOption<TRoute, TOptions>;

export type RouteResponse<TRoute> = TRoute extends ApiRoute<{ response: infer TResponse }> ? TResponse : never;

export type ApiClientOptions = {
  origin: "bff" | "backend";
  resolveAccessToken?: () => Promise<string | null>;
};

export type ApiClient<TRoutes extends ApiRoutes> = <
  const TPath extends ApiPath<TRoutes>,
  const TMethod extends MethodFor<TRoutes, TPath>,
  const TOptions extends RequestOptions<RouteConfig<TRoutes, TPath, TMethod>>,
>(
  path: TPath,
  method: TMethod,
  options: StrictRequestOptions<RouteConfig<TRoutes, TPath, TMethod>, TOptions>,
) => Promise<RouteResponse<RouteConfig<TRoutes, TPath, TMethod>>>;
