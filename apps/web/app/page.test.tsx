import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the welcome screen and auth links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /share the day with people who matter/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create account/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/login");
    expect(
      within(screen.getByLabelText(/feed preview/i)).getByText(/maya johnson/i),
    ).toBeInTheDocument();
  });
});
