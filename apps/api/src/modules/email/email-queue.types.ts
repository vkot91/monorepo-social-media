import { EMAIL_JOB_NAMES } from "./email-queue.constants";

export type WelcomeEmailJob = {
  displayName: string;
  email: string;
};

export type EmailJobName = (typeof EMAIL_JOB_NAMES)[keyof typeof EMAIL_JOB_NAMES];
export type EmailJobData = WelcomeEmailJob;
