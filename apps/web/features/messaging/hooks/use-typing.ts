"use client";

import type { TypingEvent } from "@social/contracts";
import { useCallback, useEffect, useState } from "react";

import { getRealtimeSocket } from "#/shared/lib/realtime/socket";

export const useTyping = (conversationId: string) => {
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);

  useEffect(() => {
    const socket = getRealtimeSocket();

    const onTyping = (payload: TypingEvent) => {
      if (payload.conversationId === conversationId) {
        setIsCounterpartTyping(payload.isTyping);
      }
    };

    socket.on("typing", onTyping);

    return () => {
      socket.off("typing", onTyping);
      setIsCounterpartTyping(false);
    };
  }, [conversationId]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      getRealtimeSocket().emit("typing", { conversationId, isTyping });
    },
    [conversationId],
  );

  return { emitTyping, isCounterpartTyping };
};
