import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseInterceptors } from "@nestjs/common";
import {
  AuthResponseSchema,
  AuthUserSchema,
  type LoginInput,
  loginSchema,
  type LogoutInput,
  logoutSchema,
  type RefreshTokenInput,
  refreshTokenSchema,
  type RegisterInput,
  registerSchema,
} from "@social/contracts";

import { ZodResponseInterceptor } from "#common/interceptors/response.interceptor";
import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { delay } from "#common/utils/delay";

import { AuthService } from "./auth.service";
import { PublicRoute, RefreshTokenRoute } from "./decorators/auth-route-type.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthTokenPayload } from "./types/auth-token-payload";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Post("register")
  @UseInterceptors(ZodResponseInterceptor(AuthResponseSchema))
  register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    return this.authService.register(input);
  }

  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @Post("login")
  @UseInterceptors(ZodResponseInterceptor(AuthResponseSchema))
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.authService.login(input);
  }

  @Get("me")
  @UseInterceptors(ZodResponseInterceptor(AuthUserSchema))
  async me(@CurrentUser() user: AuthTokenPayload) {
    await delay(1_000);

    return this.authService.getCurrentUser(user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @RefreshTokenRoute()
  @Post("refresh")
  @UseInterceptors(ZodResponseInterceptor(AuthResponseSchema))
  refresh(@Body(new ZodValidationPipe(refreshTokenSchema)) input: RefreshTokenInput) {
    return this.authService.refresh(input.refreshToken);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @RefreshTokenRoute()
  @Post("logout")
  logout(@Body(new ZodValidationPipe(logoutSchema)) input: LogoutInput) {
    return this.authService.logout(input.refreshToken);
  }
}
