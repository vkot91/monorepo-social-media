import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { env } from "#config/env";

import { EmailProcessor } from "./email.processor";
import { EMAIL_QUEUE_NAME } from "./email-queue.constants";
import { EmailQueueService } from "./email-queue.service";
import { MailerService } from "./mailer.service";

@Module({
  exports: [EmailQueueService],
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          url: env.REDIS_URL,
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
