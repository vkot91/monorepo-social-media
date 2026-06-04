import type { PostImageDto } from "@social/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostImageGallery } from ".";

const buildImages = (count: number): PostImageDto[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `image-${index}`,
    imageId: `storage-${index}`,
    imageUrl: `https://example.com/image-${index}.jpg`,
    position: index,
  }));

const getFrames = () => screen.getAllByRole("button", { name: /open post image/i });

describe("PostImageGallery", () => {
  it("renders the first frame tall and the remaining frames filling their rows for three images", () => {
    render(<PostImageGallery images={buildImages(3)} />);

    const [firstFrame, ...remainingFrames] = getFrames();
    expect(remainingFrames).toHaveLength(2);

    // First image spans both rows of the fixed-height grid.
    expect(firstFrame?.className).toContain("row-span-2");

    // The two right-hand frames must fill their row track. Using `aspect-square`
    // here sizes them to the column width, overflowing the fixed-height grid and
    // making them overlap.
    for (const frame of remainingFrames) {
      expect(frame.className).not.toContain("aspect-square");
      expect(frame.className).toContain("h-full");
    }
  });
});
