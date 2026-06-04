"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousBodyOverflow: string | null = null;

/**
 * Locks `document.body` scroll while `locked` is true. A shared counter keeps the
 * lock active until every consumer (modals, lightboxes, …) has released it, and
 * the original `overflow` value is restored once the last one unlocks.
 */
export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) {
      return;
    }

    if (lockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        document.body.style.overflow = previousBodyOverflow ?? "";
        previousBodyOverflow = null;
      }
    };
  }, [locked]);
};
