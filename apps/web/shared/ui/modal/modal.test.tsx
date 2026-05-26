import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../button";
import { Modal } from "./modal";

describe("Modal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders a labelled dialog when open", () => {
    render(
      <Modal description="Update the post content." onOpenChange={vi.fn()} open title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: /edit post/i })).toHaveTextContent("Modal content");
    expect(screen.getByText(/update the post content/i)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal onOpenChange={vi.fn()} open={false} title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from escape, backdrop, and close button", () => {
    const onOpenChange = vi.fn();

    render(
      <Modal onOpenChange={onOpenChange} open title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog", { name: /edit post/i }));
    fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(3);
  });

  it("renders footer actions", () => {
    render(
      <Modal footer={<Button>Save</Button>} onOpenChange={vi.fn()} open title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("locks body scroll while open and restores the previous value when closed", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <Modal onOpenChange={vi.fn()} open title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Modal onOpenChange={vi.fn()} open={false} title="Edit post">
        <p>Modal content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe("auto");
  });

  it("keeps body scroll locked until every open modal is closed", () => {
    const { rerender } = render(
      <>
        <Modal onOpenChange={vi.fn()} open title="Edit post">
          <p>First modal</p>
        </Modal>
        <Modal onOpenChange={vi.fn()} open title="Remove post">
          <p>Second modal</p>
        </Modal>
      </>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Modal onOpenChange={vi.fn()} open={false} title="Edit post">
          <p>First modal</p>
        </Modal>
        <Modal onOpenChange={vi.fn()} open title="Remove post">
          <p>Second modal</p>
        </Modal>
      </>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Modal onOpenChange={vi.fn()} open={false} title="Edit post">
          <p>First modal</p>
        </Modal>
        <Modal onOpenChange={vi.fn()} open={false} title="Remove post">
          <p>Second modal</p>
        </Modal>
      </>,
    );

    expect(document.body.style.overflow).toBe("");
  });
});
