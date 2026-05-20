import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";

import { LoggingService } from "#common/logging/logging.service";

import { EMAIL_JOB_NAMES, EMAIL_QUEUE_NAME } from "./email-queue.constants";
import type { EmailJobData, EmailJobName, WelcomeEmailJob } from "./email-queue.types";

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<EmailJobData, void, EmailJobName>,
    private readonly loggingService: LoggingService,
  ) {}

  async enqueueWelcomeEmail(job: WelcomeEmailJob) {
    try {
      await this.emailQueue.add(EMAIL_JOB_NAMES.welcome, job, {
        attempts: 3,
        backoff: {
          delay: 5_000,
          type: "exponential",
        },
        removeOnComplete: true,
        removeOnFail: 1_000,
      });
    } catch (error) {
      this.loggingService.error(
        EmailQueueService.name,
        `Failed to enqueue welcome email for ${job.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
