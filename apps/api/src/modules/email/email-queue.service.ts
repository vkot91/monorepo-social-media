import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bullmq";

import { EMAIL_JOB_NAMES, EMAIL_QUEUE_NAME } from "./email-queue.constants";
import type { EmailJobData, EmailJobName, WelcomeEmailJob } from "./email-queue.types";

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<EmailJobData, void, EmailJobName>,
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
      this.logger.error(
        `Failed to enqueue welcome email for ${job.email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
