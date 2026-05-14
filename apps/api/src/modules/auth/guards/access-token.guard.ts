import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";

import {
  AUTH_ROUTE_TYPE_METADATA_KEY,
  type AuthRouteType,
} from "../decorators/auth-route-type.decorator";
import type { AuthTokenPayload } from "../types/auth-token-payload";
import type { AuthenticatedRequest } from "../types/authenticated-request";

import { getApiEnv } from "#config/env";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly env = getApiEnv();

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const routeType = this.reflector.getAllAndOverride<AuthRouteType>(
      AUTH_ROUTE_TYPE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (routeType === "public" || routeType === "refresh") {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: this.env.JWT_ACCESS_SECRET,
      });

      if (payload.type !== "access") {
        throw new UnauthorizedException("Invalid access token");
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException("Invalid access token");
    }
  }

  private extractBearerToken(request: AuthenticatedRequest) {
    const authorization = request.headers?.authorization;

    if (typeof authorization !== "string") {
      return null;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
