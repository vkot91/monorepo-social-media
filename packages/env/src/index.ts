import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

const emptyStringToUndefined = (value: unknown) => (value === "" ? undefined : value);

const stringBoolean = z.preprocess((value) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean());

const requiredSecret = z.string().min(32, "Secret must be at least 32 characters long");

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(3001)),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6380"),
  JWT_ACCESS_SECRET: requiredSecret,
  JWT_REFRESH_SECRET: requiredSecret,
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),
  MAIL_FROM: z.string().default("Social Media <no-reply@example.com>"),
  SMTP_HOST: z.preprocess(emptyStringToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyStringToUndefined, z.coerce.number().int().positive().default(465)),
  SMTP_SECURE: z.preprocess(emptyStringToUndefined, stringBoolean.default(false)),
  SMTP_USER: z.preprocess(emptyStringToUndefined, z.string().optional()),
  SMTP_PASSWORD: z.preprocess(emptyStringToUndefined, z.string().optional()),
});

export const webEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
});

export const databaseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().url(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return apiEnvSchema.parse(env);
}

export function parseWebEnv(env: NodeJS.ProcessEnv = process.env): WebEnv {
  return webEnvSchema.parse(env);
}

export function parseDatabaseEnv(env: NodeJS.ProcessEnv = process.env): DatabaseEnv {
  return databaseEnvSchema.parse(env);
}
