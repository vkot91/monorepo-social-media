import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";

import { EmailModule } from "../email/email.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./guards/access-token.guard";
import { RefreshTokenGuard } from "./guards/refresh-token.guard";
import { HashService } from "./services/hash.service";

@Module({
  controllers: [AuthController],
  imports: [EmailModule, JwtModule.register({})],
  providers: [
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useExisting: AccessTokenGuard,
    },
    AuthService,
    HashService,
    RefreshTokenGuard,
  ],
  exports: [AccessTokenGuard, AuthService, RefreshTokenGuard],
})
export class AuthModule {}
