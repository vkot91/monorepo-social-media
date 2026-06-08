"use client";

import { useCallback, useRef } from "react";

/**
 * Leading-edge throttle: `run` invokes the callback immediately, then ignores
 * further calls until `delayMs` has elapsed. `reset` clears the window so the
 * next `run` fires right away (useful when an activity burst ends).
 */
export const useThrottledCallback = <Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) => {
  const lastRunAt = useRef(0);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const run = useCallback(
    (...args: Args) => {
      const now = Date.now();

      if (now - lastRunAt.current >= delayMs) {
        lastRunAt.current = now;
        callbackRef.current(...args);
      }
    },
    [delayMs],
  );

  const reset = useCallback(() => {
    lastRunAt.current = 0;
  }, []);

  return { reset, run };
};
