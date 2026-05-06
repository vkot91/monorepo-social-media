import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { PostsModule } from "./modules/posts/posts.module";

@Module({
  imports: [AuthModule, HealthModule, MaintenanceModule, PostsModule],
})
export class AppModule {}
