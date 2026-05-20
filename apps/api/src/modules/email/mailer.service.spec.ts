import { createTransport } from "nodemailer";

import { env as mockEnv } from "#config/env";

import { MailerService } from "./mailer.service";

const mockSendMail = jest.fn();

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

jest.mock("#config/env", () => ({
  env: jest.requireActual("#test/env").createTestApiEnv({
    MAIL_FROM: "Social Media <no-reply@example.com>",
  }),
}));

describe("MailerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(
      mockEnv,
      jest.requireActual("#test/env").createTestApiEnv({
        MAIL_FROM: "Social Media <no-reply@example.com>",
      }),
    );
  });

  it("uses JSON transport when SMTP is not configured", () => {
    new MailerService();

    expect(createTransport).toHaveBeenCalledWith({
      jsonTransport: true,
    });
  });

  it("sends escaped welcome email content", async () => {
    const service = new MailerService();

    await service.sendWelcomeEmail({
      displayName: '<Ada "Countess">',
      email: "ada@example.com",
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: "Social Media <no-reply@example.com>",
      html: expect.stringContaining("&lt;Ada &quot;Countess&quot;&gt;"),
      subject: "Welcome to Social Media",
      text: expect.stringContaining('<Ada "Countess">'),
      to: "ada@example.com",
    });
  });

  it("uses SMTP transport when SMTP host is configured", () => {
    Object.assign(mockEnv, {
      SMTP_HOST: "smtp.example.com",
      SMTP_PASSWORD: "secret",
      SMTP_PORT: 465,
      SMTP_SECURE: true,
      SMTP_USER: "mailer",
    });

    new MailerService();

    expect(createTransport).toHaveBeenCalledWith({
      auth: {
        pass: "secret",
        user: "mailer",
      },
      host: "smtp.example.com",
      port: 465,
      secure: true,
    });
  });

  it("uses SMTP transport without auth when credentials are not configured", () => {
    Object.assign(mockEnv, {
      SMTP_HOST: "smtp.example.com",
      SMTP_PASSWORD: undefined,
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      SMTP_USER: undefined,
    });

    new MailerService();

    expect(createTransport).toHaveBeenCalledWith({
      auth: undefined,
      host: "smtp.example.com",
      port: 587,
      secure: false,
    });
  });
});
