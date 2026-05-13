import { AuthApiRoutes } from "../auth/actions.type";
import { PostsApiRoutes } from "../posts";
import { ApiRoute, RequestType } from "../types";

export type ApiMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type QueryValue = boolean | number | string | null | undefined;

export type ApiRoutes = AuthApiRoutes & PostsApiRoutes;

export type ApiPath = keyof ApiRoutes;
export type MethodFor<TPath extends ApiPath> = Extract<keyof ApiRoutes[TPath], ApiMethod>;

export type RouteConfig<
  TPath extends ApiPath,
  TMethod extends MethodFor<TPath>,
> = ApiRoutes[TPath][TMethod];

export type BaseRequestOptions = {
  cache?: RequestCache;
  retryOnUnauthorized?: boolean;
};

export type AuthOption<TRoute> =
  TRoute extends ApiRoute<{ auth: infer TAuth extends boolean; response: unknown }>
    ? { auth?: TAuth }
    : { auth?: true };

export type RequestTypeOption<TRoute> =
  TRoute extends ApiRoute<{
    requestType: infer TRequestType extends RequestType;
    response: unknown;
  }>
    ? { requestType?: TRequestType }
    : { requestType?: "server" };

export type BodyOption<TRoute> =
  TRoute extends ApiRoute<{ body: infer TBody; response: unknown }>
    ? { body: TBody }
    : { body?: never };

export type QueryParamsOption<TRoute> =
  TRoute extends ApiRoute<{
    queryParams: infer TQuery extends object;
    response: unknown;
  }>
    ? { queryParams: TQuery }
    : { queryParams?: never };

export type RequestOptions<TRoute> = BaseRequestOptions &
  AuthOption<TRoute> &
  RequestTypeOption<TRoute> &
  BodyOption<TRoute> &
  QueryParamsOption<TRoute>;

export type NoExtraKeys<TExpected, TActual> = TActual &
  Record<Exclude<keyof TActual, keyof TExpected>, never>;

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

export type RouteResponse<TRoute> =
  TRoute extends ApiRoute<{ response: infer TResponse }> ? TResponse : never;

export type RequestFactoryOptions = {
  resolveAccessToken?: () => Promise<string | null>;
};
