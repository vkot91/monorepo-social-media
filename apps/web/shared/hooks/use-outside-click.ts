"use client";

import { type RefObject, useEffect } from "react";

type UseOutsideClickOptions = {
  enabled?: boolean;
  onOutsideClick: (event: PointerEvent) => void;
  ref: RefObject<HTMLElement | null>;
};

export const useOutsideClick = ({ enabled = true, onOutsideClick, ref }: UseOutsideClickOptions) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onOutsideClick(event);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [enabled, onOutsideClick, ref]);
};
