import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodError, ZodType } from "zod";

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

@Injectable()
export class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
  constructor(private readonly schema: ZodType<TOutput>) {}

  transform(value: unknown): TOutput {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(formatZodError(result.error));
    }

    return result.data;
  }
}
