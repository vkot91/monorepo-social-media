import { z } from "zod";

import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("returns parsed data", () => {
    const pipe = new ZodValidationPipe(
      z.object({
        email: z.string().trim().toLowerCase().email(),
      }),
    );

    expect(pipe.transform({ email: " ADA@EXAMPLE.COM " })).toEqual({
      email: "ada@example.com",
    });
  });

  it("throws a flattened bad request for invalid data", () => {
    const pipe = new ZodValidationPipe(
      z.object({
        email: z.string().email(),
      }),
    );

    try {
      pipe.transform({ email: "not-an-email" });
      throw new Error("Expected pipe to throw");
    } catch (error) {
      expect(error).toMatchObject({
        response: {
          message: ["email: Invalid email"],
        },
      });
    }
  });

  it("formats root-level validation errors", () => {
    const pipe = new ZodValidationPipe(z.string().min(1));

    try {
      pipe.transform("");
      throw new Error("Expected pipe to throw");
    } catch (error) {
      expect(error).toMatchObject({
        response: {
          message: ["String must contain at least 1 character(s)"],
        },
      });
    }
  });
});
