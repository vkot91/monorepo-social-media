"use client";

import { useCallback, useEffect, useRef } from "react";

import { useThrottledCallback } from "#/shared/hooks/use-throttled-callback";

import { useTyping } from "./use-typing";

// Stop advertising "typing" after this much keyboard silence.
const TYPING_IDLE_MS = 2000;
// Re-send the keepalive at most this often while the user keeps typing.
const TYPING_THROTTLE_MS = 3000;

/**
 * Turns raw keystrokes into a throttled stream of typing events: `notifyTyping`
 * emits a throttled "typing" keepalive and arms an idle timer that emits "stopped
 * typing" once the user pauses. `stopTyping` flushes that state immediately.
 */
export const useTypingNotifier = (conversationId: string) => {
  const { emitTyping } = useTyping(conversationId);
  const idleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { reset: resetThrottle, run: emitTypingStart } = useThrottledCallback(
    () => emitTyping(true),
    TYPING_THROTTLE_MS,
  );

  const stopTyping = useCallback(() => {
    if (idleTimeout.current) {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = null;
    }

    resetThrottle();
    emitTyping(false);
  }, [emitTyping, resetThrottle]);

  const notifyTyping = useCallback(() => {
    emitTypingStart();

    if (idleTimeout.current) {
      clearTimeout(idleTimeout.current);
    }

    idleTimeout.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [emitTypingStart, stopTyping]);

  useEffect(() => () => stopTyping(), [stopTyping]);

  return { notifyTyping, stopTyping };
};
