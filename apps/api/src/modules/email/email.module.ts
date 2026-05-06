import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { getApiEnv } from "#config/env";

import { EMAIL_QUEUE_NAME } from "./email-queue.constants";
import { EmailQueueService } from "./email-queue.service";
import { EmailProcessor } from "./email.processor";
import { MailerService } from "./mailer.service";

@Module({
  exports: [EmailQueueService],
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: getApiEnv().REDIS_URL,
        },
      }),
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
    }),
  ],
  providers: [EmailQueueService, EmailProcessor, MailerService],
})
export class EmailModule {}
