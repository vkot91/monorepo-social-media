import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [RefreshTokenCleanupService],
})
export class MaintenanceModule {}
