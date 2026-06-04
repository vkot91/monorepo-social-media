// backendClient behavior is covered by request.test.ts.
// This file exists as a placeholder to verify the module exports the client correctly.

import { describe, expect, it } from "vitest";

import { backendClient } from "./backend-client";

describe("backendClient", () => {
  it("is a function", () => {
    expect(backendClient).toBeTypeOf("function");
  });
});
