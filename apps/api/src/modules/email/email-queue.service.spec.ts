import { EMAIL_JOB_NAMES } from "./email-queue.constants";
import { EmailQueueService } from "./email-queue.service";

describe("EmailQueueService", () => {
  it("enqueues welcome email jobs with retry options", async () => {
    const queue = {
      add: jest.fn().mockResolvedValue({}),
    };
    const service = new EmailQueueService(queue as never);

    await service.enqueueWelcomeEmail({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    });

    expect(queue.add).toHaveBeenCalledWith(
      EMAIL_JOB_NAMES.welcome,
      {
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
      {
        attempts: 3,
        backoff: {
          delay: 5_000,
          type: "exponential",
        },
        removeOnComplete: true,
        removeOnFail: 1_000,
      },
    );
  });

  it("logs queueing failures without throwing", async () => {
    const queue = {
      add: jest.fn().mockRejectedValue(new Error("redis unavailable")),
    };
    const service = new EmailQueueService(queue as never);
    const loggerSpy = jest.spyOn(service["logger"], "error").mockImplementation();

    await expect(
      service.enqueueWelcomeEmail({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    ).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith(
      "Failed to enqueue welcome email for ada@example.com",
      expect.any(String),
    );
  });

  it("logs queueing failures without a stack for non-error rejections", async () => {
    const queue = {
      add: jest.fn().mockRejectedValue("redis unavailable"),
    };
    const service = new EmailQueueService(queue as never);
    const loggerSpy = jest.spyOn(service["logger"], "error").mockImplementation();

    await expect(
      service.enqueueWelcomeEmail({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    ).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith(
      "Failed to enqueue welcome email for ada@example.com",
      undefined,
    );
  });
});
