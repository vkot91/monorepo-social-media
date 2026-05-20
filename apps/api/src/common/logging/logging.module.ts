import { Global, Module } from "@nestjs/common";

import { LoggingService } from "./logging.service";

@Global()
@Module({
  exports: [LoggingService],
  providers: [LoggingService],
})
export class LoggingModule {}
