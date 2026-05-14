import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AuthLayout from "./layout";

describe("AuthLayout", () => {
  it("renders auth route content inside the auth shell", () => {
    render(
      <AuthLayout>
        <div>Auth child</div>
      </AuthLayout>,
    );

    expect(screen.getByText(/auth child/i)).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
