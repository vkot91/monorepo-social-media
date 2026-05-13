import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("FeedLoading", () => {
  it("renders the feed loading skeleton", () => {
    render(<Loading />);

    expect(screen.getByRole("heading", { name: /your feed/i })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/posts loading/i)).toHaveLength(3);
  });
});
