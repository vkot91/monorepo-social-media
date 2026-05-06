import { EMAIL_JOB_NAMES } from "./email-queue.constants";
import { EmailProcessor } from "./email.processor";

describe("EmailProcessor", () => {
  it("sends welcome email jobs", async () => {
    const mailerService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };
    const processor = new EmailProcessor(mailerService as never);

    await processor.process({
      data: {
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
      name: EMAIL_JOB_NAMES.welcome,
    } as never);

    expect(mailerService.sendWelcomeEmail).toHaveBeenCalledWith({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("ignores unknown email job names", async () => {
    const mailerService = {
      sendWelcomeEmail: jest.fn(),
    };
    const processor = new EmailProcessor(mailerService as never);

    await processor.process({
      data: {
        displayName: "Ada Lovelace",
        email: "ada@example.com",
      },
      name: "unknown",
    } as never);

    expect(mailerService.sendWelcomeEmail).not.toHaveBeenCalled();
  });
});
