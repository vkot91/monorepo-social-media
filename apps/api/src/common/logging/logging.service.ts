import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class LoggingService {
  private readonly shouldWriteLogs = () => process.env.NODE_ENV !== "test";

  log(context: string, message: unknown) {
    if (!this.shouldWriteLogs()) {
      return;
    }

    new Logger(context).log(message);
  }

  error(context: string, message: unknown, trace?: string) {
    if (!this.shouldWriteLogs()) {
      return;
    }

    new Logger(context).error(message, trace);
  }

  warn(context: string, message: unknown) {
    if (!this.shouldWriteLogs()) {
      return;
    }

    new Logger(context).warn(message);
  }
}
