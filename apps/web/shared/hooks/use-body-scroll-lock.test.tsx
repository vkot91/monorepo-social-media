import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useBodyScrollLock } from "./use-body-scroll-lock";

const Harness = ({ locked }: { locked: boolean }) => {
  useBodyScrollLock(locked);

  return null;
};

describe("useBodyScrollLock", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll while locked and restores the previous value when released", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(<Harness locked />);
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<Harness locked={false} />);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("keeps the lock until every consumer releases it", () => {
    const { rerender } = render(
      <>
        <Harness locked />
        <Harness locked />
      </>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Harness locked />
        <Harness locked={false} />
      </>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <>
        <Harness locked={false} />
        <Harness locked={false} />
      </>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});
