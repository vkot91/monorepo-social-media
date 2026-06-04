import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostImageLightbox } from "./post-image-lightbox";

const image = { id: "image-1", imageId: "storage-1", imageUrl: "https://example.com/image-1.jpg", position: 0 };

describe("PostImageLightbox", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders nothing when there is no image", () => {
    render(<PostImageLightbox image={undefined} index={0} onClose={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders a labelled dialog with the full-size image and locks body scroll", () => {
    render(<PostImageLightbox image={image} index={1} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: /post image 2/i })).toBeInTheDocument();
    expect(screen.getByAltText(/post image 2 full view/i)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes from escape, backdrop, and the close button", () => {
    const onClose = vi.fn();

    render(<PostImageLightbox image={image} index={0} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /close image viewer/i }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
