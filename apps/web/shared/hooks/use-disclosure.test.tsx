import { renderHook } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { useDisclosure } from "./use-disclosure";

describe("useDisclosure", () => {
  it("opens, closes, and toggles disclosure state", () => {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
  });

  it("supports a default open state", () => {
    const { result } = renderHook(() => useDisclosure({ defaultOpen: true }));

    expect(result.current.isOpen).toBe(true);
  });

  it("notifies when the open state changes", () => {
    const onOpenChange = vi.fn();
    const { result } = renderHook(() => useDisclosure({ onOpenChange }));

    act(() => result.current.onOpenChange(true));
    act(() => result.current.setOpen(false));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });
});
