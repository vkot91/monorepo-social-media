import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PostVisibilityPicker } from "./post-visibility-picker";

describe("PostVisibilityPicker", () => {
  it("shows Public label when value is PUBLIC", () => {
    render(<PostVisibilityPicker onChange={vi.fn()} value="PUBLIC" />);

    expect(screen.getByRole("button", { name: /change post visibility/i })).toHaveTextContent("Public");
  });

  it("shows Friends label when value is FRIENDS", () => {
    render(<PostVisibilityPicker onChange={vi.fn()} value="FRIENDS" />);

    expect(screen.getByRole("button", { name: /change post visibility/i })).toHaveTextContent("Friends");
  });

  it("calls onChange with FRIENDS when Friends menu item is selected", () => {
    const onChange = vi.fn();

    render(<PostVisibilityPicker onChange={onChange} value="PUBLIC" />);
    fireEvent.click(screen.getByRole("button", { name: /change post visibility/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /friends/i }));

    expect(onChange).toHaveBeenCalledWith("FRIENDS");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("calls onChange with PUBLIC when Public menu item is selected", () => {
    const onChange = vi.fn();

    render(<PostVisibilityPicker onChange={onChange} value="FRIENDS" />);
    fireEvent.click(screen.getByRole("button", { name: /change post visibility/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /public/i }));

    expect(onChange).toHaveBeenCalledWith("PUBLIC");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
