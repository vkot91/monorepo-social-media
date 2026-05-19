import { cookies } from "next/headers";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RootLayout from "./layout";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const cookieStore = {
  get: vi.fn(),
};

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockReset();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
    );
  });

  it("renders its children", async () => {
    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <div>child content</div>,
      }),
    );

    expect(markup).toContain('lang="en"');
    expect(markup).toContain("child content");
  });

  it("omits theme markup when the saved preference is system", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "system" });

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <div>child content</div>,
      }),
    );

    expect(markup).not.toContain("data-theme");
  });

  it("renders the saved concrete theme before first paint", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "dark" });

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <div>child content</div>,
      }),
    );

    expect(markup).toContain('data-theme="dark"');
  });
});
