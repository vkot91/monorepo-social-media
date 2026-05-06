import { Injectable } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import type JSONTransport from "nodemailer/lib/json-transport";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { getApiEnv } from "#config/env";

type WelcomeEmailInput = {
  displayName: string;
  email: string;
};

@Injectable()
export class MailerService {
  private readonly from: string;
  private readonly transporter: Transporter;

  constructor() {
    const env = getApiEnv();

    this.from = env.MAIL_FROM;
    this.transporter = env.SMTP_HOST
      ? createTransport(buildSmtpTransportOptions(env))
      : createTransport(buildJsonTransportOptions());
  }

  async sendWelcomeEmail(input: WelcomeEmailInput) {
    await this.transporter.sendMail({
      from: this.from,
      html: [
        `<p>Hi ${escapeHtml(input.displayName)},</p>`,
        "<p>Welcome to Social Media. Your account is ready.</p>",
      ].join(""),
      subject: "Welcome to Social Media",
      text: `Hi ${input.displayName},\n\nWelcome to Social Media. Your account is ready.`,
      to: input.email,
    });
  }
}

function buildSmtpTransportOptions(env: ReturnType<typeof getApiEnv>): SMTPTransport.Options {
  return {
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            pass: env.SMTP_PASSWORD,
            user: env.SMTP_USER,
          }
        : undefined,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  };
}

function buildJsonTransportOptions(): JSONTransport.Options {
  return {
    jsonTransport: true,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
