import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PostImage } from "./post-image";

const optimizedSrc = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

describe("PostImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading overlay for optimized images until they finish loading", async () => {
    render(<PostImage alt="Post image 1" sizes="100vw" src={optimizedSrc} />);

    expect(screen.getByRole("status", { name: /loading post image 1/i })).toBeInTheDocument();

    fireEvent.load(screen.getByRole("img", { name: /post image 1/i }));

    await waitFor(() =>
      expect(screen.queryByRole("status", { name: /loading post image 1/i })).not.toBeInTheDocument(),
    );
  });
});
