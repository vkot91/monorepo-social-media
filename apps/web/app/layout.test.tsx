import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders its children", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>child content</div>
      </RootLayout>,
    );

    expect(markup).toContain('lang="en"');
    expect(markup).toContain("child content");
  });
});
