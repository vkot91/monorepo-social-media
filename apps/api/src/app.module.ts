import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { FriendshipsModule } from "./modules/friendships/friendships.module";
import { HealthModule } from "./modules/health/health.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { PostsModule } from "./modules/posts/posts.module";

@Module({
  imports: [AuthModule, FriendshipsModule, HealthModule, MaintenanceModule, PostsModule],
})
export class AppModule {}
