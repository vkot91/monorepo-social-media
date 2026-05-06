import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

import { EMAIL_JOB_NAMES, EMAIL_QUEUE_NAME } from "./email-queue.constants";
import type { EmailJobData, EmailJobName } from "./email-queue.types";
import { MailerService } from "./mailer.service";

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<EmailJobData, void, EmailJobName>): Promise<void> {
    if (job.name === EMAIL_JOB_NAMES.welcome) {
      await this.mailerService.sendWelcomeEmail(job.data);
    }
  }
}
