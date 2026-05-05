import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("renders the project heading and feature list", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /social media clone workspace/i }),
    ).toBeInTheDocument();
    const plannedFeatures = screen.getByRole("region", {
      name: /planned features/i,
    });

    expect(within(plannedFeatures).getByRole("list")).toBeInTheDocument();
    expect(
      screen.getByText(/jwt auth with access and refresh tokens/i),
    ).toBeInTheDocument();
  });
});
