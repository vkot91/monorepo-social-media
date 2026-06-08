import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";

import { LoggingModule } from "#common/logging/logging.module";

import { RequestTimingMiddleware } from "./common/middleware/request-timing.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { FriendshipsModule } from "./modules/friendships/friendships.module";
import { HealthModule } from "./modules/health/health.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { MediaModule } from "./modules/media/media.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { PostsModule } from "./modules/posts/posts.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";

@Module({
  imports: [
    LoggingModule,
    AuthModule,
    FriendshipsModule,
    HealthModule,
    MaintenanceModule,
    MediaModule,
    MessagingModule,
    PostsModule,
    RealtimeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTimingMiddleware).forRoutes("*");
  }
}
