import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type { AuthTokenPayload } from "../types/auth-token-payload";
import type { AuthenticatedRequest } from "../types/authenticated-request";

import { getApiEnv } from "#config/env";

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  private readonly env = getApiEnv();

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractRefreshToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing refresh token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(token, {
        secret: this.env.JWT_REFRESH_SECRET,
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  private extractRefreshToken(request: AuthenticatedRequest) {
    const body = request.body;

    if (!isRefreshTokenBody(body) || !body.refreshToken) {
      return null;
    }

    return body.refreshToken;
  }
}

function isRefreshTokenBody(body: unknown): body is { refreshToken?: string } {
  return typeof body === "object" && body !== null;
}
