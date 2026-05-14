import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  type LoginInput,
  loginSchema,
  type LogoutInput,
  logoutSchema,
  type RefreshTokenInput,
  refreshTokenSchema,
  type RegisterInput,
  registerSchema,
} from "@social/contracts";

import { AuthService } from "./auth.service";
import { PublicRoute, RefreshTokenRoute } from "./decorators/auth-route-type.decorator";

import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @PublicRoute()
  @Post("register")
  register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput) {
    return this.authService.register(input);
  }

  @HttpCode(HttpStatus.OK)
  @PublicRoute()
  @Post("login")
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput) {
    return this.authService.login(input);
  }

  @HttpCode(HttpStatus.OK)
  @RefreshTokenRoute()
  @Post("refresh")
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
