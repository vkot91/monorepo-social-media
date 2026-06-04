import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ManagedPostImage,
  POST_IMAGE_ACCEPT,
  POST_IMAGE_MAX_COUNT,
  POST_IMAGE_MAX_SIZE_BYTES,
  PostImageManager,
} from ".";

const existingImage = (id: string, imageUrl: string): ManagedPostImage => ({
  id,
  imageId: `storage-${id}`,
  imageUrl,
  kind: "existing",
});

const imageFile = (name: string, type = "image/jpeg", size = 1024) => {
  const file = new File(["image-content"], name, { type });

  Object.defineProperty(file, "size", {
    value: size,
  });

  return file;
};

type ManagerHarnessProps = {
  initialImages?: ManagedPostImage[];
  onImagesChange?: (images: ManagedPostImage[]) => void;
};

const ManagerHarness = ({ initialImages = [], onImagesChange }: ManagerHarnessProps) => {
  const [images, setImages] = useState(initialImages);

  const onChange = (nextImages: ManagedPostImage[]) => {
    setImages(nextImages);
    onImagesChange?.(nextImages);
  };

  return (
    <>
      <PostImageManager images={images} onChange={onChange} />
      <output data-testid="image-count">{images.length}</output>
    </>
  );
};

const renderManager = (ui: ReactElement) => render(ui);

describe("PostImageManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Assign the object-URL helpers directly on the real `URL` constructor so
    // `new URL(...)` keeps working for optimized-image detection.
    URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
    URL.revokeObjectURL = vi.fn();
  });

  it("accepts JPG, PNG, and WebP files and shows local previews", () => {
    const onImagesChange = vi.fn();

    renderManager(<ManagerHarness onImagesChange={onImagesChange} />);

    const fileInput = screen.getByLabelText(/choose post images/i);
    const jpgFile = imageFile("first.jpg", "image/jpeg");
    const webpFile = imageFile("second.webp", "image/webp");

    expect(fileInput).toHaveAttribute("accept", POST_IMAGE_ACCEPT);

    fireEvent.change(fileInput, {
      target: {
        files: [jpgFile, webpFile],
      },
    });

    expect(screen.getByTestId("image-count")).toHaveTextContent("2");
    expect(screen.getByRole("img", { name: /post image preview 1/i })).toHaveAttribute("src", "blob:first.jpg");
    expect(screen.getByRole("img", { name: /post image preview 2/i })).toHaveAttribute("src", "blob:second.webp");
    expect(URL.createObjectURL).toHaveBeenCalledWith(jpgFile);
    expect(URL.createObjectURL).toHaveBeenCalledWith(webpFile);
    expect(onImagesChange).toHaveBeenCalledWith([
      expect.objectContaining({
        file: jpgFile,
        kind: "local",
        previewUrl: "blob:first.jpg",
      }),
      expect.objectContaining({
        file: webpFile,
        kind: "local",
        previewUrl: "blob:second.webp",
      }),
    ]);
  });

  it("rejects unsupported file types before adding previews", () => {
    renderManager(<ManagerHarness />);

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [imageFile("notes.txt", "text/plain")],
      },
    });

    expect(screen.getByText("notes.txt must be a JPG, PNG, or WebP image.")).toBeInTheDocument();
    expect(screen.getByTestId("image-count")).toHaveTextContent("0");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects files over 5 MB before adding previews", () => {
    renderManager(<ManagerHarness />);

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [imageFile("large.png", "image/png", POST_IMAGE_MAX_SIZE_BYTES + 1)],
      },
    });

    expect(screen.getByText("large.png must be 5 MB or smaller.")).toBeInTheDocument();
    expect(screen.getByTestId("image-count")).toHaveTextContent("0");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("rejects adding more than four images", () => {
    renderManager(
      <ManagerHarness
        initialImages={[
          existingImage("image-1", "https://example.com/one.jpg"),
          existingImage("image-2", "https://example.com/two.jpg"),
          existingImage("image-3", "https://example.com/three.jpg"),
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [imageFile("fourth.jpg"), imageFile("fifth.jpg")],
      },
    });

    expect(screen.getByText(`You can add up to ${POST_IMAGE_MAX_COUNT} images.`)).toBeInTheDocument();
    expect(screen.getByTestId("image-count")).toHaveTextContent("3");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("removes local images and revokes their object URLs", () => {
    renderManager(<ManagerHarness />);

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [imageFile("first.jpg")],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /remove post image 1/i }));

    expect(screen.getByTestId("image-count")).toHaveTextContent("0");
    expect(screen.queryByRole("img", { name: /post image preview 1/i })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first.jpg");
  });

  it("reorders images with keyboard-friendly sortable handles", async () => {
    const onImagesChange = vi.fn();
    const user = userEvent.setup();

    renderManager(
      <ManagerHarness
        initialImages={[
          existingImage("image-1", "https://example.com/one.jpg"),
          existingImage("image-2", "https://example.com/two.jpg"),
        ]}
        onImagesChange={onImagesChange}
      />,
    );

    const list = screen.getByRole("list");

    expect(within(list).getAllByRole("img").map((image) => image.getAttribute("src"))).toEqual([
      "https://example.com/one.jpg",
      "https://example.com/two.jpg",
    ]);

    expect(screen.queryByRole("button", { name: /move post image 2 left/i })).not.toBeInTheDocument();

    const secondImageHandle = screen.getByRole("button", { name: /reorder post image 2/i });

    secondImageHandle.focus();

    await user.keyboard("[Space][ArrowLeft][Space]");

    expect(within(list).getAllByRole("img").map((image) => image.getAttribute("src"))).toEqual([
      "https://example.com/two.jpg",
      "https://example.com/one.jpg",
    ]);
    expect(onImagesChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: "image-2" }),
      expect.objectContaining({ id: "image-1" }),
    ]);
  });

  it("revokes local preview URLs when unmounted", () => {
    const { unmount } = renderManager(<ManagerHarness />);

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [imageFile("first.jpg")],
      },
    });

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first.jpg");
  });
});
