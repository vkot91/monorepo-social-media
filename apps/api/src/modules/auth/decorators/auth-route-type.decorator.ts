import { applyDecorators,SetMetadata, UseGuards } from "@nestjs/common";

import { RefreshTokenGuard } from "../guards/refresh-token.guard";

export const AUTH_ROUTE_TYPE_METADATA_KEY = "auth:route-type";

export type AuthRouteType = "access" | "public" | "refresh";

export function PublicRoute() {
  return SetMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, "public" satisfies AuthRouteType);
}

export function RefreshTokenRoute() {
  return applyDecorators(
    SetMetadata(AUTH_ROUTE_TYPE_METADATA_KEY, "refresh" satisfies AuthRouteType),
    UseGuards(RefreshTokenGuard),
  );
}
