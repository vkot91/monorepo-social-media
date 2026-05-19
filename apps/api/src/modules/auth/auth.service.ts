import { randomUUID } from "node:crypto";

import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse, AuthTokens, AuthUserDto, LoginInput, RegisterInput } from "@social/contracts";
import { prisma } from "@social/database";

import { durationToMilliseconds } from "#common/utils/token-duration";
import { getApiEnv } from "#config/env";

import { EmailQueueService } from "../email/email-queue.service";
import { type AuthUserRecord, authUserSelect, serializeAuthUser } from "./auth.serializer";
import { HashService } from "./services/hash.service";
import type { AuthTokenPayload } from "./types/auth-token-payload";

type InternalAuthTokens = AuthTokens & {
  refreshTokenId: string;
};

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

@Injectable()
export class AuthService {
  private readonly env = getApiEnv();
  constructor(
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const passwordHash = await this.hashService.hash(input.password);

    try {
      const user = await prisma.user.create({
        data: {
          displayName: input.displayName,
          email: input.email,
          passwordHash,
          username: input.username,
        },
        select: authUserSelect,
      });

      const response = await this.createAuthResponse(user);

      this.emailQueueService
        .enqueueWelcomeEmail({
          displayName: user.displayName,
          email: user.email,
        })
        .catch(() => undefined);

      return response;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException("Email or username is already in use");
      }

      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user || !(await this.hashService.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.createAuthResponse(user);
  }

  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    const user = await prisma.user.findUnique({
      select: authUserSelect,
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    return serializeAuthUser(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    if (!payload.jti) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      include: {
        user: {
          select: authUserSelect,
        },
      },
      where: {
        id: payload.jti,
      },
    });

    const now = new Date();

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= now ||
      !(await this.hashService.compare(refreshToken, storedToken.tokenHash))
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokens = await this.buildTokens(storedToken.user);
    const nextTokenHash = await this.hashService.hash(tokens.refreshToken);

    await prisma.$transaction([
      prisma.refreshToken.update({
        data: {
          revokedAt: now,
        },
        where: {
          id: storedToken.id,
        },
      }),
      prisma.refreshToken.create({
        data: {
          expiresAt: this.getRefreshExpiration(),
          id: tokens.refreshTokenId,
          tokenHash: nextTokenHash,
          userId: storedToken.userId,
        },
      }),
    ]);

    return stripRefreshTokenId(tokens);
  }

  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);

    if (!payload.jti) {
      return;
    }

    await prisma.refreshToken.updateMany({
      data: {
        revokedAt: new Date(),
      },
      where: {
        id: payload.jti,
        revokedAt: null,
      },
    });
  }

  private async createAuthResponse(user: AuthUserRecord): Promise<AuthResponse> {
    const tokens = await this.buildTokens(user);
    const refreshTokenHash = await this.hashService.hash(tokens.refreshToken);

    await prisma.refreshToken.create({
      data: {
        expiresAt: this.getRefreshExpiration(),
        id: tokens.refreshTokenId,
        tokenHash: refreshTokenHash,
        userId: user.id,
      },
    });

    return {
      ...stripRefreshTokenId(tokens),
    };
  }

  private async buildTokens(user: AuthUserRecord): Promise<InternalAuthTokens> {
    const refreshTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          email: user.email,
          sub: user.id,
          type: "access",
          username: user.username,
        } satisfies AuthTokenPayload,
        {
          expiresIn: toJwtExpiresIn(this.env.JWT_ACCESS_EXPIRES_IN),
          secret: this.env.JWT_ACCESS_SECRET,
        },
      ),
      this.jwtService.signAsync(
        {
          email: user.email,
          jti: refreshTokenId,
          sub: user.id,
          type: "refresh",
          username: user.username,
        } satisfies AuthTokenPayload,
        {
          expiresIn: toJwtExpiresIn(this.env.JWT_REFRESH_EXPIRES_IN),
          secret: this.env.JWT_REFRESH_SECRET,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
    };
  }

  private getRefreshExpiration() {
    return new Date(Date.now() + durationToMilliseconds(this.env.JWT_REFRESH_EXPIRES_IN));
  }

  private async verifyRefreshToken(refreshToken: string): Promise<AuthTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.env.JWT_REFRESH_SECRET,
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}

function stripRefreshTokenId(tokens: InternalAuthTokens): AuthTokens {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

function toJwtExpiresIn(duration: string): number {
  return Math.floor(durationToMilliseconds(duration) / 1000);
}
