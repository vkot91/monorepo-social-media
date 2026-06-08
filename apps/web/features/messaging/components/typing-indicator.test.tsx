import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TypingIndicator } from "./typing-indicator";

describe("TypingIndicator", () => {
  it("renders a typing hint when active", () => {
    render(<TypingIndicator isTyping />);

    expect(screen.getByText("typing…")).toBeInTheDocument();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(<TypingIndicator isTyping={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
