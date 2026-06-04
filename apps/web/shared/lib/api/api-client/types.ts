import type { AuthBackendApiRoutes, AuthBffApiRoutes } from "#/features/auth/api/routes";
import type { PostsBackendApiRoutes, PostsBffApiRoutes } from "#/features/posts/api/routes";

import type { ApiRoute } from "../types";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type QueryValue = boolean | number | string | null | undefined;

// Aggregate route maps — add new feature routes here as the app grows.
export type BackendApiRoutes = AuthBackendApiRoutes & PostsBackendApiRoutes;
export type BffApiRoutes = AuthBffApiRoutes & PostsBffApiRoutes;

export type ApiRoutes = BffApiRoutes | BackendApiRoutes;

// --- Path / method helpers ---

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

export type RouteResponse<TRoute> = TRoute extends ApiRoute<{ response: infer TResponse }> ? TResponse : never;

// --- Request option helpers ---

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
  signal?: AbortSignal;
};

export type AuthOption<TRoute> =
  TRoute extends ApiRoute<{ auth: infer TAuth extends boolean; response: unknown }>
    ? { auth?: TAuth }
    : { auth?: true };

export type BodyOption<TRoute> =
  TRoute extends ApiRoute<{ body: infer TBody; response: unknown }> ? { body: TBody } : { body?: never };

export type ParamsOption<TRoute> =
  TRoute extends ApiRoute<{ params: infer TParams extends object; response: unknown }>
    ? { params: TParams }
    : { params?: never };

export type QueryParamsOption<TRoute> =
  TRoute extends ApiRoute<{ queryParams: infer TQuery extends object; response: unknown }>
    ? { queryParams: TQuery }
    : { queryParams?: never };

export type RequestOptions<TRoute> = BaseRequestOptions &
  AuthOption<TRoute> &
  BodyOption<TRoute> &
  ParamsOption<TRoute> &
  QueryParamsOption<TRoute>;

// --- Strict option helpers (forbid extra keys) ---

type NoExtraKeys<TExpected, TActual> = TActual & Record<Exclude<keyof TActual, keyof TExpected>, never>;

type StrictBodyOption<TRoute, TOptions> =
  TRoute extends ApiRoute<{ body: infer TBody; response: unknown }>
    ? TOptions extends { body: infer TActualBody }
      ? { body: NoExtraKeys<TBody, TActualBody> }
      : { body: TBody }
    : { body?: never };

type StrictParamsOption<TRoute, TOptions> =
  TRoute extends ApiRoute<{ params: infer TParams extends object; response: unknown }>
    ? TOptions extends { params: infer TActualParams }
      ? { params: NoExtraKeys<TParams, TActualParams> }
      : { params: TParams }
    : { params?: never };

type StrictQueryParamsOption<TRoute, TOptions> =
  TRoute extends ApiRoute<{ queryParams: infer TQuery extends object; response: unknown }>
    ? TOptions extends { queryParams: infer TActualQueryParams }
      ? { queryParams: NoExtraKeys<TQuery, TActualQueryParams> }
      : { queryParams: TQuery }
    : { queryParams?: never };

export type StrictRequestOptions<TRoute, TOptions> = NoExtraKeys<RequestOptions<TRoute>, TOptions> &
  Omit<RequestOptions<TRoute>, "body" | "params" | "queryParams"> &
  StrictBodyOption<TRoute, TOptions> &
  StrictParamsOption<TRoute, TOptions> &
  StrictQueryParamsOption<TRoute, TOptions>;

// --- Client signature ---

export type ApiClient<TRoutes extends ApiRoutes> = <
  const TPath extends ApiPath<TRoutes>,
  const TMethod extends MethodFor<TRoutes, TPath>,
  const TOptions extends RequestOptions<RouteConfig<TRoutes, TPath, TMethod>>,
>(
  path: TPath,
  method: TMethod,
  options: StrictRequestOptions<RouteConfig<TRoutes, TPath, TMethod>, TOptions>,
) => Promise<RouteResponse<RouteConfig<TRoutes, TPath, TMethod>>>;
